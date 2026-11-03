//
// Totebird: proxy private Backblaze B2 (S3-compatible) for GET/HEAD downloads
// at files.totebird.com. Uploads stay on app → B2 presigned PUT (not this Worker).
//
// Revoke-on-close: object keys are users/{userId}/links/{linkId}/…
// Before streaming, the Worker asks the app whether that link is still active
// (FILES_CDN_CHECK_SECRET + TOTEBIRD_APP_ORIGIN). Closed/archived/disabled → 403.
// Freelancer downloads use the app’s signed B2 path, not this Worker.
//
// Vendored from https://github.com/backblaze-b2-samples/cloudflare-b2
// (itself adapted from https://github.com/obezuk/worker-signed-s3-template)
//
import { AwsClient } from 'aws4fetch'

/** Parse linkId from Totebird storage keys: users/{userId}/links/{linkId}/… */
function linkIdFromObjectKey(path) {
    const m = String(path || '').match(/^users\/[^/]+\/links\/([^/]+)\//);
    return m ? m[1] : null;
}

/**
 * Ask the Next.js app whether CDN may serve objects for this link.
 * Fail closed when check env is configured; if unset, allow (local/dev).
 */
async function assertLinkAllowsCdn(env, linkId) {
    const origin = String(env['TOTEBIRD_APP_ORIGIN'] || '').replace(/\/$/, '');
    const secret = String(env['FILES_CDN_CHECK_SECRET'] || '');
    if (!origin || !secret) {
        console.warn(
            '[totebird-files-b2] TOTEBIRD_APP_ORIGIN / FILES_CDN_CHECK_SECRET unset — skipping revoke check',
        );
        return { ok: true, skipped: true };
    }

    const url = `${origin}/api/internal/cdn-access?linkId=${encodeURIComponent(linkId)}`;
    let res;
    try {
        res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secret}`,
                Accept: 'application/json',
            },
        });
    } catch (err) {
        console.error('[totebird-files-b2] cdn-access fetch failed', err);
        return { ok: false, status: 503 };
    }

    if (res.status === 401 || res.status === 403) {
        return { ok: false, status: 403 };
    }
    if (!res.ok) {
        console.error('[totebird-files-b2] cdn-access HTTP', res.status);
        return { ok: false, status: 503 };
    }

    let body;
    try {
        body = await res.json();
    } catch {
        return { ok: false, status: 503 };
    }
    if (!body || body.allow !== true) {
        return { ok: false, status: 403 };
    }
    return { ok: true, skipped: false };
}

/** Sensitive docs: do not let CF edge cache bytes past close. */
function withNoStore(response) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.delete('Expires');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

const UNSIGNABLE_HEADERS = [
    // These headers appear in the request, but are never passed upstream
    'x-forwarded-proto',
    'x-real-ip',
    // We can't include accept-encoding in the signature because Cloudflare
    // sets the incoming accept-encoding header to "gzip, br", then modifies
    // the outgoing request to set accept-encoding to "gzip".
    // Not cool, Cloudflare!
    'accept-encoding',
    // Conditional headers are not consistently passed upstream
    'if-match',
    'if-modified-since',
    'if-none-match',
    'if-range',
    'if-unmodified-since',
];

// URL needs colon suffix on protocol, and port as a string
const HTTPS_PROTOCOL = "https:";
const HTTPS_PORT = "443";

// How many times to retry a range request where the response is missing content-range
const RANGE_RETRY_ATTEMPTS = 3;

// Filter out cf-* and any other headers we don't want to include in the signature
function filterHeaders(headers, env) {
    // Suppress irrelevant IntelliJ warning
    // noinspection JSCheckFunctionSignatures
    return new Headers(Array.from(headers.entries())
        .filter(pair => !(
            UNSIGNABLE_HEADERS.includes(pair[0])
            || pair[0].startsWith('cf-')
            || ('ALLOWED_HEADERS' in env && !env['ALLOWED_HEADERS'].includes(pair[0]))
        ))
    );
}

function createHeadResponse(response) {
    return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
    });
}

function isListBucketRequest(env, path) {
    const pathSegments = path.split('/');

    return (env['BUCKET_NAME'] === "$path" && pathSegments.length < 2) // https://endpoint/bucket-name/
        || (env['BUCKET_NAME'] !== "$path" && path.length === 0); // https://bucket-name.endpoint/ or https://endpoint/
}

// Supress IntelliJ's "unused default export" warning
// noinspection JSUnusedGlobalSymbols
export default {
    async fetch(request, env) {
        // Only allow GET and HEAD methods
        if (!['GET', 'HEAD'].includes(request.method)){
            return new Response(null, {
                status: 405,
                statusText: "Method Not Allowed"
            });
        }

        const url = new URL(request.url);

        // Incoming protocol and port is taken from the worker's environment.
        // Local dev mode uses plain http on 8787, and it's possible to deploy
        // a worker on plain http. B2 only supports https on 443
        url.protocol = HTTPS_PROTOCOL;
        url.port = HTTPS_PORT;

        // Remove leading slashes from path
        let path = url.pathname.replace(/^\//, '');
        // Remove trailing slashes
        path = path.replace(/\/$/, '');

        // Reject list bucket requests unless configuration allows it
        if (isListBucketRequest(env, path) && String(env['ALLOW_LIST_BUCKET']) !== "true") {
            return new Response(null, {
                status: 404,
                statusText: "Not Found"
            });
        }

        // Revoke CDN when the owning link is closed / archived / disabled.
        const linkId = linkIdFromObjectKey(path);
        if (!linkId) {
            // Only Totebird key layout is served; unknown shapes → 404
            return new Response(null, {
                status: 404,
                statusText: "Not Found"
            });
        }
        const access = await assertLinkAllowsCdn(env, linkId);
        if (!access.ok) {
            return new Response(null, {
                status: access.status || 403,
                statusText: access.status === 503 ? "Service Unavailable" : "Forbidden",
                headers: { "Cache-Control": "private, no-store" },
            });
        }

        // Set RCLONE_DOWNLOAD to "true" to use rclone with --b2-download-url
        // See https://rclone.org/b2/#b2-download-url
        const rcloneDownload = String(env["RCLONE_DOWNLOAD"]) === 'true';

        // Set upstream target hostname.
        switch (env['BUCKET_NAME']) {
            case "$path":
                // Bucket name is initial segment of URL path
                url.hostname = env['B2_ENDPOINT'];
                break;
            case "$host":
                // Bucket name is initial subdomain of the incoming hostname
                url.hostname = url.hostname.split('.')[0] + '.' + env['B2_ENDPOINT'];
                break;
            default:
                // Bucket name is specified in the BUCKET_NAME variable
                url.hostname = env['BUCKET_NAME'] + "." + env['B2_ENDPOINT'];
                break;
        }

        // Certain headers, such as x-real-ip, appear in the incoming request but
        // are removed from the outgoing request. If they are in the outgoing
        // signed headers, B2 can't validate the signature.
        const headers = filterHeaders(request.headers, env);

        // Create an S3 API client that can sign the outgoing request
        const client = new AwsClient({
            "accessKeyId": env['B2_APPLICATION_KEY_ID'],
            "secretAccessKey": env['B2_APPLICATION_KEY'],
            "service": "s3",
        });

        // Save the request method, so we can process responses for HEAD requests appropriately
        const requestMethod = request.method;

        if (rcloneDownload) {
            if (env['BUCKET_NAME'] === "$path") {
                // Remove leading file/ prefix from the path
                url.pathname = path.replace(/^file\//, "");
            } else {
                // Remove leading file/{bucket_name}/ prefix from the path 
                url.pathname = path.replace(/^file\/[^/]+\//, "");
            }            
        }

        // Sign the outgoing request
        //
        // For HEAD requests Cloudflare appears to change the method on the outgoing request to GET (#18), which
        // breaks the signature, resulting in a 403. So, change all HEADs to GETs. This is not too inefficient,
        // since we won't read the body of the response if the original request was a HEAD.
        const signedRequest = await client.sign(url.toString(), {
            method: 'GET',
            headers: headers
        });

        // For large files, Cloudflare will return the entire file, rather than the requested range
        // So, if there is a range header in the request, check that the response contains the
        // content-range header. If not, abort the request and try again.
        // See https://community.cloudflare.com/t/cloudflare-worker-fetch-ignores-byte-request-range-on-initial-request/395047/4
        if (signedRequest.headers.has("range")) {
            let attempts = RANGE_RETRY_ATTEMPTS;
            let response;
            do {
                let controller = new AbortController();
                response = await fetch(signedRequest.url, {
                    method: signedRequest.method,
                    headers: signedRequest.headers,
                    signal: controller.signal,
                });
                if (response.headers.has("content-range")) {
                    // Only log if it didn't work first time
                    if (attempts < RANGE_RETRY_ATTEMPTS) {
                        console.log(`Retry for ${signedRequest.url} succeeded - response has content-range header`);
                    }
                    // Break out of loop and return the response
                    break;
                } else if (response.ok) {
                    attempts -= 1;
                    console.error(`Range header in request for ${signedRequest.url} but no content-range header in response. Will retry ${attempts} more times`);
                    // Do not abort on the last attempt, as we want to return the response
                    if (attempts > 0) {
                        controller.abort();
                    }
                } else {
                    // Response is not ok, so don't retry
                    break;
                }
            } while (attempts > 0);

            if (attempts <= 0) {
                console.error(`Tried range request for ${signedRequest.url} ${RANGE_RETRY_ATTEMPTS} times, but no content-range in response.`);
            }

            if (requestMethod === 'HEAD') {
                // Original request was HEAD, so return a new Response without a body
                return withNoStore(createHeadResponse(response));
            }

            // Return whatever response we have rather than an error response
            // This response cannot be aborted, otherwise it will raise an exception
            return withNoStore(response);
        }

        // Send the signed request to B2
        const fetchPromise = fetch(signedRequest);

        if (requestMethod === 'HEAD') {
            const response = await fetchPromise;
            // Original request was HEAD, so return a new Response without a body
            return withNoStore(createHeadResponse(response));
        }

        // Strip public cache headers so close/archive revokes promptly
        return withNoStore(await fetchPromise);
    },
};

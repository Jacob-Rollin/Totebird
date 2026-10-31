import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasB2, maxUploadBytes } from "@/lib/env";
import { newId } from "@/lib/ids";

/** Optional CDN (Cloudflare Worker at files.totebird.com). */
export function filesBaseUrl() {
  const base = process.env.NEXT_PUBLIC_FILES_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

/** Pretty public URL when NEXT_PUBLIC_FILES_BASE_URL is set. */
export function publicFileUrl(storageKey: string) {
  const base = filesBaseUrl();
  if (!base || !storageKey) return null;
  return `${base}/${storageKey.replace(/^\//, "")}`;
}

/**
 * Href for freelancer Download: CDN + object key when configured,
 * otherwise the authenticated app download route (signed B2 GET).
 */
export function resolveFileDownloadHref(input: {
  fileId: string;
  storageKey: string;
}) {
  return (
    publicFileUrl(input.storageKey) ?? `/api/files/${input.fileId}/download`
  );
}

/**
 * Shared Backblaze B2 bucket via S3-compatible API.
 * One bucket for all users; keys are prefixed users/{userId}/links/{linkId}/...
 */
function client() {
  if (!hasB2()) return null;
  const endpoint = process.env.B2_ENDPOINT!.replace(/\/$/, "");
  const region =
    process.env.B2_REGION ||
    endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i)?.[1] ||
    "us-west-004";

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APPLICATION_KEY!,
    },
    // B2 S3-compatible API expects path-style URLs.
    forcePathStyle: true,
    // AWS SDK v3 defaults (WHEN_SUPPORTED) inject flexible checksums into
    // PutObject presigns (x-amz-checksum-crc32, x-amz-sdk-checksum-algorithm).
    // checklist-client only sends Content-Type on the browser PUT, so those
    // query params break B2 uploads. Only checksum when the API requires it.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function objectKey(input: {
  userId: string;
  linkId: string;
  filename: string;
}) {
  const safeName = input.filename.replace(/[^\w.\-]+/g, "_");
  return `users/${input.userId}/links/${input.linkId}/${newId()}-${safeName}`;
}

export async function createPresignedUpload(input: {
  filename: string;
  contentType: string;
  sizeBytes: number;
  userId: string;
  linkId: string;
}) {
  if (input.sizeBytes > maxUploadBytes()) {
    return {
      ok: false as const,
      error: `File exceeds max size (${maxUploadBytes()} bytes)`,
    };
  }

  const key = objectKey({
    userId: input.userId,
    linkId: input.linkId,
    filename: input.filename,
  });

  if (!hasB2()) {
    return {
      ok: true as const,
      demo: true as const,
      key,
      uploadUrl: null as string | null,
      publicUrl: null as string | null,
      message:
        "Upload isn’t configured — file metadata will be stored; upload skipped in demo.",
    };
  }

  try {
    const s3 = client()!;
    // Match checklist-client PUT: Content-Type only (no checksum headers).
    // Do not sign ContentLength — browsers set it on PUT; mismatched signed
    // length is a common cause of opaque upload failures with special filenames.
    // Do not set ChecksumAlgorithm — that reintroduces x-amz-checksum-* on the URL.
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 10,
      // Ensure Content-Type stays a signed header (client always sends it).
      signableHeaders: new Set(["content-type"]),
    });

    // Optional CDN base (Cloudflare Worker at files.totebird.com).
    // Until the Worker exists, clients still upload via the signed B2 URL.
    const publicUrl = publicFileUrl(key);

    return {
      ok: true as const,
      demo: false as const,
      key,
      uploadUrl,
      publicUrl,
      message: null as string | null,
    };
  } catch (err) {
    console.error(
      "[totebird] B2 presign failed",
      err instanceof Error ? err.message : err,
    );
    return {
      ok: false as const,
      error:
        "Upload isn’t configured — could not create a storage upload URL. Check B2 env on Netlify.",
    };
  }
}

/** Short-lived signed GET for private B2 objects (link-owner downloads). */
export async function createPresignedDownload(input: {
  storageKey: string;
  filename?: string;
  expiresIn?: number;
}) {
  if (!hasB2()) {
    return {
      ok: false as const,
      error: "File storage isn’t configured.",
    };
  }

  try {
    const s3 = client()!;
    const safeName = (input.filename || "download").replace(/"/g, "");
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: input.storageKey,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: input.expiresIn ?? 60 * 15,
    });
    return { ok: true as const, url };
  } catch (err) {
    console.error(
      "[totebird] B2 download presign failed",
      err instanceof Error ? err.message : err,
    );
    return {
      ok: false as const,
      error: "Could not create a download link. Check B2 env on Netlify.",
    };
  }
}

import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasB2, maxUploadBytes, missingB2EnvNames } from "@/lib/env";
import { newId } from "@/lib/ids";

/**
 * Shared Backblaze B2 bucket via S3-compatible API.
 * One bucket for all users; keys are prefixed users/{userId}/links/{linkId}/...
 */
function client() {
  if (!hasB2()) return null;
  // Netlify needs a full URL (https://…). Cloudflare Worker uses host-only —
  // if someone pasted the Worker value, signing throws Invalid URL.
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
  });
}

function presignConfigError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/invalid url/i.test(raw)) {
    return "Upload isn’t configured — B2_ENDPOINT must be a full https:// URL (e.g. https://s3.REGION.backblazeb2.com), not the Worker host-only value. Check B2 env on Netlify.";
  }
  return "Upload isn’t configured — could not create a storage upload URL. Check B2 env on Netlify.";
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
    const missing = missingB2EnvNames().join(", ");
    return {
      ok: true as const,
      demo: true as const,
      key,
      uploadUrl: null as string | null,
      publicUrl: null as string | null,
      message: missing
        ? `Upload isn’t configured — missing ${missing}. File metadata will be stored; upload skipped in demo.`
        : "Upload isn’t configured — file metadata will be stored; upload skipped in demo.",
    };
  }

  try {
    const s3 = client()!;
    // Do not sign ContentLength — browsers set it on PUT; mismatched signed
    // length is a common cause of opaque upload failures with special filenames.
    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: key,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });

    // Optional CDN base (Cloudflare Worker at files.totebird.com — Phase 5).
    // Until the Worker exists, clients still upload via the signed B2 URL.
    const filesBase = process.env.NEXT_PUBLIC_FILES_BASE_URL;
    const publicUrl = filesBase
      ? `${filesBase.replace(/\/$/, "")}/${key}`
      : null;

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
      error: presignConfigError(err),
    };
  }
}

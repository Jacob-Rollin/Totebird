import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasB2, maxUploadBytes } from "@/lib/env";
import { newId } from "@/lib/ids";

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
        "B2 is not configured — file metadata will be stored; upload skipped in demo.",
    };
  }

  const s3 = client()!;
  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET!,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.sizeBytes,
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
}

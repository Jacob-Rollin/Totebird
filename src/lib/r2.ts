import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hasR2, maxUploadBytes } from "@/lib/env";
import { newId } from "@/lib/ids";

function client() {
  if (!hasR2()) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function createPresignedUpload(input: {
  filename: string;
  contentType: string;
  sizeBytes: number;
  linkId: string;
}) {
  if (input.sizeBytes > maxUploadBytes()) {
    return {
      ok: false as const,
      error: `File exceeds max size (${maxUploadBytes()} bytes)`,
    };
  }

  const key = `uploads/${input.linkId}/${newId()}-${input.filename.replace(/[^\w.\-]+/g, "_")}`;

  if (!hasR2()) {
    return {
      ok: true as const,
      demo: true as const,
      key,
      uploadUrl: null as string | null,
      publicUrl: null as string | null,
      message:
        "R2 is not configured — file metadata will be stored; upload skipped in demo.",
    };
  }

  const s3 = client()!;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.sizeBytes,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
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

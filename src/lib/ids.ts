import { randomBytes } from "crypto";

export function newId(prefix?: string) {
  const id = randomBytes(12).toString("hex");
  return prefix ? `${prefix}_${id}` : id;
}

export function newToken() {
  return randomBytes(24).toString("base64url");
}

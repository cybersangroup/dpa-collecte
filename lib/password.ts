import { createHash, timingSafeEqual } from "crypto";

export function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyPassword(plainText: string, hash: string) {
  const plainHash = hashPassword(plainText);
  const plainBuffer = Buffer.from(plainHash);
  const hashBuffer = Buffer.from(hash);

  if (plainBuffer.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(plainBuffer, hashBuffer);
}

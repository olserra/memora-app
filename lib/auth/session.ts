import { NewUser } from "@/lib/db/schema";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { cache } from "react";

// Ensure we have a non-empty secret to sign tokens with. jose (used by SignJWT)
// will throw a "Zero-length key is not supported" error when given an empty
// key. Prefer `NEXTAUTH_SECRET` if present (common convention). Auto-generate
// a temporary secret in development to make local work easier (sessions won't
// persist across restarts when auto-generated).
const rawAuthSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
let authSecretToUse = rawAuthSecret;
if (!rawAuthSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET environment variable is required in production to sign session tokens"
    );
  } else {
    // Dev fallback: try to persist the generated secret across module reloads
    // by storing it on globalThis. This avoids signature verification failures
    // when the module is reloaded during development (HMR).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (g.__MEMORA_DEV_AUTH_SECRET) {
      authSecretToUse = g.__MEMORA_DEV_AUTH_SECRET as string;
    } else {
      authSecretToUse = randomBytes(32).toString("hex");
      g.__MEMORA_DEV_AUTH_SECRET = authSecretToUse;
      // eslint-disable-next-line no-console
      console.warn(
        "Warning: AUTH_SECRET is not set. Using an auto-generated secret for development. Set AUTH_SECRET in your .env to persist sessions across restarts."
      );
    }
  }
}

const key = new TextEncoder().encode(authSecretToUse);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1 day from now")
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as SessionData;
}

export const getSession = cache(async () => {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await verifyToken(session);
});

export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set("session", encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

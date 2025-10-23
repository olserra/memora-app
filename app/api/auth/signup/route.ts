import { hashPassword, setSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  // inviteId ignored in B2C migration

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const [createdUser] = await db
    .insert(users)
    .values({ email, passwordHash, role: "owner" })
    .returning();
  if (!createdUser) {
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }

  // B2C: do not create teams or invitations; just create user and session.
  await setSession(createdUser);

  return NextResponse.json({ ok: true });
}

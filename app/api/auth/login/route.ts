import { comparePasswords, setSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  const usersFound = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (usersFound.length === 0) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 400 }
    );
  }
  const foundUser = usersFound[0];
  const isValid = await comparePasswords(password, foundUser.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 400 }
    );
  }

  await setSession(foundUser);

  return NextResponse.json({ ok: true });
}

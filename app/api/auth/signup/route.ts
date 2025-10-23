import { hashPassword, setSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { invitations, teamMembers, teams, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const inviteId = String(form.get("inviteId") || "");

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

  let teamId: number | undefined;

  if (inviteId && /^\d+$/.test(inviteId)) {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, Number.parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (invitation) {
      teamId = invitation.teamId;
      await db
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, invitation.id));
    }
  }

  if (!teamId) {
    const [createdTeam] = await db
      .insert(teams)
      .values({ name: `${email}'s Team` })
      .returning();
    teamId = createdTeam?.id;
  }

  await db
    .insert(teamMembers)
    .values({ userId: createdUser.id, teamId: teamId!, role: "owner" });
  await setSession(createdUser);

  return NextResponse.json({ ok: true });
}

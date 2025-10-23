import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json(null);

  // Include subscription info from the user's team (if any) so frontend can
  // display planName and subscriptionStatus without requiring a separate /api/team call.
  const team = await getTeamForUser();

  const payload = {
    ...user,
    planName: team?.planName ?? null,
    subscriptionStatus: team?.subscriptionStatus ?? null,
    stripeCustomerId: team?.stripeCustomerId ?? null,
    stripeSubscriptionId: team?.stripeSubscriptionId ?? null,
  };

  return Response.json(payload);
}

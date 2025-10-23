import { getUser } from "@/lib/db/queries";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json(null);

  // B2C: return only user-scoped fields.
  const payload = {
    ...user,
  };

  return Response.json(payload);
}

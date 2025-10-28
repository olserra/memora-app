import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}

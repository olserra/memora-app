import { Suspense } from "react";
import AuthGuard from "./auth-guard";
import ClientLayout from "./client-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <ClientLayout>{children}</ClientLayout>
      </AuthGuard>
    </Suspense>
  );
}

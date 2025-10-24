"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Profile page removed — send users to General Settings instead
    router.replace('/dashboard/general');
  }, [router]);

  return null;
}

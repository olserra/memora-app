"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClientHome() {
  return (
    <main className="bg-white min-h-screen flex flex-col justify-center items-center">
      <section className="py-24 text-center px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Memora</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
          Your personal AI memory assistant. Capture ideas, transcribe calls,
          and recall everything instantly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="bg-orange-600 text-white">
              Sign in
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              Pricing
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

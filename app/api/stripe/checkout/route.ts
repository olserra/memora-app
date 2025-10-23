import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // B2C: Stripe checkout handler disabled — redirect to pricing or success page.
  return NextResponse.redirect(new URL("/pricing", "https://example.com"));
}

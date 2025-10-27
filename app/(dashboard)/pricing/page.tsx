import { checkoutAction } from "@/lib/payments/actions";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import { Check } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const premiumProduct = products.find(
    (product) => product.name === "Memora Premium"
  );
  const monthlyPrice = prices.find(
    (price) =>
      price.productId === premiumProduct?.id && price.interval === "month"
  );
  const yearlyPrice = prices.find(
    (price) =>
      price.productId === premiumProduct?.id && price.interval === "year"
  );

  // fallback numeric cents
  const proMonthlyCents = monthlyPrice?.unitAmount ?? 1200;
  const proMonthlyDisplay = proMonthlyCents / 100;
  const proMonthlyPriceId = monthlyPrice?.id;

  return (
    <main className="bg-white">
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900">$0</div>
                <div className="text-gray-500 mt-2">Forever free</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "100 memories/month",
                  "Text capture",
                  "Basic search",
                  "WhatsApp integration",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sign-in" className="block">
                <button className="w-full rounded-full border-2 px-4 py-3 text-center text-lg">
                  Start Free
                </button>
              </Link>
            </div>

            {/* Pro (dynamic price) */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-3xl border-2 border-orange-600 relative transform md:scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-sm font-bold px-4 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-bold text-white">
                  ${proMonthlyDisplay}
                </div>
                <div className="text-orange-100 mt-2">per month</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited memories",
                  "Voice transcription",
                  "Call recording",
                  "AI search & insights",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Pro checkout form (monthly) */}
              <form action={checkoutAction}>
                <input
                  type="hidden"
                  name="priceId"
                  value={proMonthlyPriceId ?? ""}
                />
                <div className="flex gap-3">
                  <SubmitButton className="w-full rounded-full bg-white text-orange-600 hover:bg-orange-50" />
                </div>
              </form>

              {/* Yearly CTA note (if yearly price exists) */}
              {yearlyPrice && yearlyPrice.unitAmount && (
                <div className="mt-4 text-sm text-orange-100 text-center">
                  Or save{" "}
                  {Math.round(
                    ((proMonthlyCents * 12 - yearlyPrice.unitAmount) /
                      (proMonthlyCents * 12)) *
                      100
                  )}
                  % with yearly billing
                </div>
              )}
            </div>

            {/* Team */}
            <div className="bg-white p-8 rounded-3xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Team</h3>
                <div className="text-4xl font-bold text-gray-900">$29</div>
                <div className="text-gray-500 mt-2">per user/month</div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Pro",
                  "Shared team memories",
                  "Admin controls",
                  "Team analytics",
                  "Dedicated support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact-sales" className="block">
                <button className="w-full rounded-full bg-orange-600 text-white hover:bg-orange-700 px-4 py-3 text-lg">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

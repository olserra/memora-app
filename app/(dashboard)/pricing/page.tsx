import { checkoutAction } from "@/lib/payments/actions";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import { Check } from "lucide-react";
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={premiumProduct?.name || "Memora Premium"}
          price={monthlyPrice?.unitAmount || 999}
          interval={monthlyPrice?.interval || "month"}
          trialDays={monthlyPrice?.trialPeriodDays || 0}
          features={[
            "Unlimited memory entries",
            "Text, audio, and call support",
            "Advanced search and filtering",
            "Priority email support",
            "Monthly usage analytics",
            "Works on WhatsApp, no app required",
            "End-to-end encryption & privacy",
          ]}
          priceId={monthlyPrice?.id}
        />
        <PricingCard
          name={premiumProduct?.name + " (Yearly)" || "Memora Premium (Yearly)"}
          price={yearlyPrice?.unitAmount || 9900}
          interval={yearlyPrice?.interval || "year"}
          trialDays={yearlyPrice?.trialPeriodDays || 0}
          features={[
            "Unlimited memory entries",
            "Text, audio, and call support",
            "Advanced search and filtering",
            "Priority email support",
            "Monthly usage analytics",
            "Works on WhatsApp, no app required",
            "End-to-end encryption & privacy",
            "17% discount for yearly billing",
          ]}
          priceId={yearlyPrice?.id}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{" "}
        <span className="text-xl font-normal text-gray-600">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}

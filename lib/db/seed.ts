import { hashPassword } from "@/lib/auth/session";
import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import { memories, users } from "./schema";

async function createStripeProducts() {
  console.log("Creating Stripe products and prices...");

  const baseProduct = await stripe.products.create({
    name: "Base",
    description: "Base subscription plan",
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: "Plus",
    description: "Plus subscription plan",
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  console.log("Stripe products and prices created successfully.");
}

async function seed() {
  const email = "test@test.com";
  const password = "admin123";
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log("Initial user created.");
  // Clear existing memories before seeding to avoid duplicates
  try {
    await db.delete(memories);
    console.log("Cleared existing memories table.");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("Failed to clear memories table (non-fatal)", e);
  }
  // optional: seed memories from the local dev file if present
  try {
    const raw = await import("../..//dev-memories.json");
    const data = raw.default || raw;
    if (Array.isArray(data) && data.length > 0) {
      for (const m of data) {
        await db.insert(memories).values({
          userId: user.id,
          title: m.title || null,
          content: m.content || "",
          tags: JSON.stringify(m.tags || []),
          category: m.category || "general",
        });
      }
      console.log("Seeded memories from dev-memories.json");
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("No dev-memories.json present or failed to read it", e);
  }
}

try {
  await seed();
  // eslint-disable-next-line no-console
  console.log("Seed process finished.");
  process.exit(0);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Seed process failed:", error);
  process.exit(1);
}

"use server";

import { redirect } from "next/navigation";

export const checkoutAction = async (_formData: FormData) => {
  // Disabled in B2C migration. Redirect to pricing.
  return redirect("/pricing");
};

export const customerPortalAction = async () => {
  // Disabled in B2C migration.
  return redirect("/pricing");
};

"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerPortalAction } from "@/lib/payments/actions";
import { TbCrown } from "react-icons/tb";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionCard() {
  const { data: userData } = useSWR<any>("/api/user", fetcher);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">
                Current Plan: {userData?.planName || "Free"}
              </p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const status = userData?.subscriptionStatus;
                  if (status === "active") return "Billed monthly";
                  if (status === "trialing") return "Trial period";
                  return "No active subscription";
                })()}
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <TbCrown className="h-4 w-4 text-white" />
                Upgrade
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Profile</h1>
      <SubscriptionCard />
    </section>
  );
}

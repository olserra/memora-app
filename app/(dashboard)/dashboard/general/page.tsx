"use client";

import { updateAccount } from "@/app/(login)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/db/schema";
import { customerPortalAction } from "@/lib/payments/actions";
import { Loader2 } from "lucide-react";
import { Suspense, useActionState } from "react";
import { TbCrown } from "react-icons/tb";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = "",
  emailValue = "",
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>("/api/user", fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ""}
      emailValue={user?.email ?? ""}
    />
  );
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      {/* Subscription card moved from Profile */}
      <SubscriptionCard />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>
            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && (
              <p className="text-green-500 text-sm">{state.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

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

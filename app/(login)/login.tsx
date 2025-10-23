"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionState } from "@/lib/auth/middleware";
import { CircleIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signIn, signUp } from "./actions";

function EmailField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <Label
        htmlFor="email"
        className="block text-sm font-medium text-gray-700"
      >
        Email
      </Label>
      <div className="mt-1">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultValue}
          required
          maxLength={50}
          className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
          placeholder="Enter your email"
        />
      </div>
    </div>
  );
}

function PasswordField({
  password,
  setPassword,
  mode,
  viewMode,
}: {
  password: string;
  setPassword: (v: string) => void;
  mode: "signin" | "signup";
  viewMode: "signin" | "signup";
}) {
  return (
    <div>
      <Label
        htmlFor="password"
        className="block text-sm font-medium text-gray-700"
      >
        Password
      </Label>
      <div className="mt-1">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={100}
          className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
          placeholder="Enter your password"
        />
      </div>
      {viewMode === "signup" && <PasswordRequirements password={password} />}
    </div>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 text-sm">
      <li className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
        {password.length >= 8 ? "✓" : "○"} At least 8 characters
      </li>
      <li
        className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}
      >
        {/[A-Z]/.test(password) ? "✓" : "○"} At least 1 uppercase letter
      </li>
      <li
        className={/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}
      >
        {/[a-z]/.test(password) ? "✓" : "○"} At least 1 lowercase letter
      </li>
      <li className={/\d/.test(password) ? "text-green-600" : "text-gray-500"}>
        {/\d/.test(password) ? "✓" : "○"} At least 1 number
      </li>
      <li
        className={
          /[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-500"
        }
      >
        {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} At least 1 special character
      </li>
    </ul>
  );
}

function GoogleSignInButton() {
  return (
    <Button
      type="button"
      className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 mb-2"
      onClick={() =>
        (window.location.href = "/api/auth/signin?provider=google")
      }
    >
      <Image
        src="/google.png"
        alt="Google logo"
        width={20}
        height={20}
        className="mr-2"
      />
      Continue with Google
    </Button>
  );
}

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const inviteId = searchParams.get("inviteId");
  const [viewMode, setViewMode] = useState<"signin" | "signup">(mode);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    viewMode === "signin" ? signIn : signUp,
    { error: "" }
  );
  const [password, setPassword] = useState("");

  // Switch to sign-in view if email is already registered
  useEffect(() => {
    if (
      viewMode === "signup" &&
      state?.error ===
        "Email already registered. Please use a different email or sign in."
    ) {
      setViewMode("signin");
    }
  }, [state?.error, viewMode]);

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {viewMode === "signin"
            ? "Sign in to your account"
            : "Create your account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ""} />
          <input type="hidden" name="priceId" value={priceId || ""} />
          <input type="hidden" name="inviteId" value={inviteId || ""} />
          <EmailField defaultValue={state.email} />
          <PasswordField
            password={password}
            setPassword={setPassword}
            mode={mode}
            viewMode={viewMode}
          />
          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}
          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : viewMode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {viewMode === "signin"
                  ? "New to our platform?"
                  : "Already have an account?"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full mt-4">
            <Link
              href={`${viewMode === "signin" ? "/sign-up" : "/sign-in"}${
                redirect ? `?redirect=${redirect}` : ""
              }${priceId ? `&priceId=${priceId}` : ""}`}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {viewMode === "signin"
                ? "Create an account"
                : "Sign in to existing account"}
            </Link>
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
}

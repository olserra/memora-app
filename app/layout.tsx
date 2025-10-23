import { getTeamForUser, getUser } from "@/lib/db/queries";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SWRConfig } from "swr";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memora - Your Personal Memory Assistant",
  description: "Never forget anything again with Memora.",
  openGraph: {
    images: "/metadata-img.png",
  },
  twitter: {
    images: "/metadata-img.png",
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              "/api/user": getUser(),
              "/api/team": getTeamForUser(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}

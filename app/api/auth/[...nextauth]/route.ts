import { setSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import type { Account, User } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) return null;
        const userArr = await db
          .select()
          .from(users)
          .where(
            and(eq(users.email, credentials.email), isNull(users.deletedAt))
          )
          .limit(1);
        const user = userArr[0];
        if (!user || !user.passwordHash) return null;
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;
        return { id: String(user.id), name: user.name, email: user.email };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists with this email
          const existingUser = await db
            .select()
            .from(users)
            .where(and(eq(users.email, user.email!), isNull(users.deletedAt)))
            .limit(1);

          if (existingUser.length === 0) {
            // Create new user for Google sign-in
            const [newUser] = await db
              .insert(users)
              .values({
                email: user.email!,
                name: user.name,
                passwordHash: null, // No password for Google users
                role: "member",
              })
              .returning();
            // Set custom session cookie
            await setSession(newUser);
          } else {
            // User exists - allow sign-in regardless of how they registered
            // If they have a password, they can still use Google
            await setSession(existingUser[0]);
          }
          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }: { token: any; user: User | undefined }) {
      if (user) {
        // Get user from database to include ID
        const dbUser = await db
          .select()
          .from(users)
          .where(and(eq(users.email, user.email!), isNull(users.deletedAt)))
          .limit(1);
        if (dbUser.length > 0) {
          token.id = dbUser[0].id;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// You need to implement findUserByEmail and password check logic above.

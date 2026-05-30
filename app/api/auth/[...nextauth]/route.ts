import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import SteamProvider from "next-auth-steam";
import { NextRequest } from "next/server";

declare module "next-auth" {
  interface Session {
    user: {
      steamId?: string;
    } & DefaultSession["user"]
  }
}

export function getAuthOptions(req?: NextRequest): AuthOptions {
  return {
    providers: [
      SteamProvider(
        req || ({ headers: { host: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000").host } } as unknown as Request),
        {
          clientSecret: process.env.STEAM_SECRET!,
          callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
        }
      ),
    ],
    callbacks: {
      async signIn({ user, account, profile }) {
        console.log("[Auth] Tentativa de Login Público. User:", user);
        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.steamId = user.id?.match(/\d+/)?.[0] || user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.steamId = token.steamId as string;
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

export const authOptions = getAuthOptions();

const handler = async (req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) => {
  return NextAuth(req, ctx, authOptions);
};

export { handler as GET, handler as POST };

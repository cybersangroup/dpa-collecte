import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password ?? "";

        if (!username || !password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { username },
          include: { city: true },
        });

        if (!user || !user.actif) {
          return null;
        }

        const isValidPassword = verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.nomComplet,
          email: `${user.username}@dpa.local`,
          role: user.role,
          cityCode: user.city.code,
          cityName: user.city.nom,
          username: user.username,
        } as const;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Lors de la connexion initiale
      if (user) {
        token.role     = (user as { role?: string }).role;
        token.cityCode = (user as { cityCode?: string }).cityCode;
        token.cityName = (user as { cityName?: string }).cityName;
        token.username = (user as { username?: string }).username;
      }
      // Lors d'un appel à session.update() côté client
      if (trigger === "update" && session) {
        if (session.name)     token.name     = session.name;
        if (session.username) token.username = session.username;
        if (session.cityCode) token.cityCode = session.cityCode;
        if (session.cityName) token.cityName = session.cityName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.sub ?? "";
        session.user.role     = String(token.role     ?? "");
        session.user.cityCode = String(token.cityCode ?? "");
        session.user.cityName = String(token.cityName ?? "");
        session.user.username = String(token.username ?? "");
      }
      return session;
    },
  },
};

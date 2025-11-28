import clientPromise, { getCollection } from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    walletAddress?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
  }
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle Google OAuth
      if (account?.provider === "google") {
        // Check if user exists, if not create one
        const usersCollection = await getCollection("users");
        const existingUser = await usersCollection.findOne({
          email: user.email!,
        });

        if (!existingUser) {
          await usersCollection.insertOne({
            email: user.email!,
            name: user.name!,
            image: user.image!,
            role: "USER",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

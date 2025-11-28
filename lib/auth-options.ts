import clientPromise, { getCollection } from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { compare } from "bcryptjs";
import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
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
    // Email/Password authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const usersCollection = await getCollection("users");
        const user = await usersCollection.findOne({
          email: credentials.email,
        });

        if (!user) {
          return null;
        }

        // Check if user has a password (for registered users)
        if (!user.password) {
          return null;
        }

        // Verify password using bcrypt
        const isValidPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
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
      // Handle wallet authentication
      if (account?.provider === "credentials" && user.walletAddress) {
        // Verify wallet signature here
        return true;
      }

      // Handle OAuth providers
      if (account?.provider === "google" || account?.provider === "github") {
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

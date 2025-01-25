import NextAuth, { AuthOptions } from "next-auth";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient"; // Your Firestore init
import { hashPassword, verifyPassword } from "@/lib/password"; // your hashing functions

export const authOptions: AuthOptions = {
  // -------------------------------------------------------
  // A) Add the Firestore Adapter
  // -------------------------------------------------------
  adapter: FirestoreAdapter(db),

  // -------------------------------------------------------
  // B) Providers
  // -------------------------------------------------------
  providers: [
    /**
     * 1) Email Provider (Magic Link)
     *    NextAuth will now store / verify tokens automatically in Firestore
     */
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // No need to override sendVerificationRequest() or handle custom token storage
      // The FirestoreAdapter takes care of that behind the scenes
    }),

    /**
     * 2) Credentials Provider (Email + Password)
     *    For users who prefer a standard email+password login
     */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Check if user doc exists in Firestore
        const userDocRef = doc(db, "users", credentials.email);
        const userDocSnap = await getDoc(userDocRef);

        // If user doesn't exist, "register" them
        if (!userDocSnap.exists()) {
          const hashed = await hashPassword(credentials.password);
          await setDoc(userDocRef, {
            email: credentials.email,
            password: hashed,
            role: "patient",
            createdAt: new Date(),
            verified: false,
          });

          return { id: credentials.email, email: credentials.email, role: "patient" };
        } else {
          // User exists -> "login" flow (compare passwords)
          const userData = userDocSnap.data();
          const isValid = await verifyPassword(credentials.password, userData.password);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          return {
            id: userData.email,
            email: userData.email,
            role: userData.role || "patient",
          };
        }
      },
    }),
  ],

  // -------------------------------------------------------
  // C) Callbacks
  // -------------------------------------------------------
  callbacks: {
    /**
     * signIn: runs after a user is returned from a provider.
     * For Credentials, it’s handled in `authorize()`, so no extra logic needed here.
     * For Email magic links, we no longer need to store tokens ourselves
     * because the FirestoreAdapter does that automatically.
     */
    async signIn({ user, account }) {
      // If using EmailProvider, no custom token logic needed now
      // If using Credentials, it's already handled in `authorize()`
      return true;
    },

    // This is how we attach user.role to the JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "patient";
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

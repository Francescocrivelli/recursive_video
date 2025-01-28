import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { app } from "@/lib/firebase"; // Import the initialized app

// Make sure Firebase is initialized before creating the handler
if (!app) {
    throw new Error('Firebase must be initialized before using NextAuth');
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
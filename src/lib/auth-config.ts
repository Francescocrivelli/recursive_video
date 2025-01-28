import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { sendVerificationEmail } from "@/lib/email"; 
import { v4 as uuidv4 } from 'uuid';
import { User } from 'next-auth';
import { app } from "@/lib/firebase"; // Import the initialized app

interface ExtendedUser extends User {
  role?: string;
}

// Initialize Firestore with the app instance
const db = getFirestore(app);

export const authOptions: NextAuthOptions = {
    providers: [
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) {
                throw new Error("User email is not defined");
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.email));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    (user as ExtendedUser).role = userData.role || "patient";
                } else {
                    (user as ExtendedUser).role = "patient";
                    const verificationToken = uuidv4();
                    await sendVerificationEmail(user.email, verificationToken);
                }
                return true;
            } catch (error) {
                console.error('Error in signIn callback:', error);
                return false;
            }
        },
        async session({ session, user }) {
            if (session.user) {
                (session.user as ExtendedUser).role = (user as ExtendedUser).role;
            }
            return session;
        },
    },
};
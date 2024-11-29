import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { sendVerificationEmail } from "@/lib/email"; 
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

const db = getFirestore();

export default NextAuth({
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
        async signIn({ user, account, profile }) {
            if (!user.email) {
                throw new Error("User email is not defined");
            }

            const userDoc = await getDoc(doc(db, "users", user.email));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                user.role = userData.role || "patient";
            } else {
                user.role = "patient";
                const verificationToken = uuidv4();
                await sendVerificationEmail(user.email, verificationToken);
            }
            return true;
        },
        async session({ session, user }) {
            session.user.role = user.role;
            return session;
        },
    },
});

// Verification endpoint
export async function POST(request: Request) {
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const db = getFirestore();
    const tokenDoc = await getDoc(doc(db, "verificationTokens", token));

    if (!tokenDoc.exists()) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { email } = tokenDoc.data();

    // Register the user in your users collection
    await setDoc(doc(db, "users", email), { email, role: "patient" });

    // Delete the token after successful registration
    await deleteDoc(doc(db, "verificationTokens", token));

    return NextResponse.json({ message: 'User registered successfully' });
}
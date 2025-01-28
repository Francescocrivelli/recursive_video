import { NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Import your initialized Firebase app

// Initialize Firestore with the app instance
const db = getFirestore(app);

export async function PATCH(request: Request) {
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const tokenDoc = await getDoc(doc(db, "verificationTokens", token));

    if (!tokenDoc.exists()) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { email } = tokenDoc.data();

    // Register the user in your users collection
    await setDoc(doc(db, "users", email), { email, role: "patient" });

    // Delete the token after successful registration
    await deleteDoc(doc(db, "verificationTokens", token));

    return NextResponse.json({ success: true });
}
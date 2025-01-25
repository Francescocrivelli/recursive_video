import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { db } from "../../lib/firebaseClient";

export async function POST(request: Request) {
  try {
    console.log("API Hit: /api/register");

    const body = await request.json();
    console.log("Request Body:", body);

    const { token } = body;

    if (!token) {
      console.error("Token is missing in the request body");
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenDoc = await getDoc(doc(db, "verificationTokens", token));
    if (!tokenDoc.exists()) {
      console.error("Invalid or expired token");
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const { email } = tokenDoc.data();
    await setDoc(doc(db, "users", email), { email, role: "patient" });
    await deleteDoc(doc(db, "verificationTokens", token));

    console.log("User registered successfully:", email);
    return NextResponse.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the config is properly loaded
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing or incorrect');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Function to assign user roles
async function assignUserRole(uid: string, role: "therapist" | "patient") {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { role }, { merge: true });
}

// Function to get user role
async function getUserRole(uid: string): Promise<"therapist" | "patient" | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data().role;
  }
  return null;
}

// Function to create a new patient
async function createPatient(patientData: {
  uid: string;
  name: string;
  email: string;
  therapyTypes: string[];
}) {
  const patientRef = doc(db, "patients", patientData.uid);
  await setDoc(patientRef, {
    ...patientData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export { 
  auth, 
  db, 
  googleProvider, 
  assignUserRole, 
  getUserRole, 
  createPatient 
};


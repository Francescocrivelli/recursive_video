import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../database_private_key.json"; // Adjusted path to the root level

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id, // Ensure this is correct
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"), // Ensure proper formatting
    }),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`, // Add the database URL
  });
}

// Export the "admin" Firestore instance:
export const db = getFirestore();
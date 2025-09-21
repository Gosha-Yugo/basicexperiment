import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

let app: FirebaseApp, db: Firestore, messaging: Messaging;
if (typeof window !== "undefined") {
  // Client-side
  app = getApps().length ? getApps()[0] : initializeApp(config);
  db = getFirestore(app);
  messaging = getMessaging(app);
}

export { app, db, messaging };

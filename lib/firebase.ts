// Client-side Firebase Phone Auth for the event website
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Phone verification isn't set up yet — Firebase config is missing. See .env.example.");
    this.name = "FirebaseNotConfiguredError";
  }
}

// Lazily initializes the Firebase app/Auth instance for the event website
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new FirebaseNotConfiguredError();
  }
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
}

export { RecaptchaVerifier };

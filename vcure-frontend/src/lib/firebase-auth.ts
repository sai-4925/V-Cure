import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "v-cure-health.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return Boolean(
    apiKey &&
    projectId &&
    apiKey.trim() !== "" &&
    projectId.trim() !== ""
  );
}

function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogleIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase configuration missing: Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are configured in environment."
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (popupErr: any) {
    if (typeof window !== "undefined") {
      console.error("[Firebase Auth Diagnostic]", {
        name: popupErr?.name,
        code: popupErr?.code,
        message: popupErr?.message,
        origin: window.location.origin,
        authDomain: auth.config.authDomain,
        providerId: provider.providerId
      });
    }

    // If popup is blocked or unsupported in mobile WebView, fallback to redirect or throw detailed error
    if (
      popupErr?.code === "auth/popup-blocked" ||
      popupErr?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      try {
        await signInWithRedirect(auth, provider);
        const redirectRes = await getRedirectResult(auth);
        if (redirectRes?.user) {
          return await redirectRes.user.getIdToken();
        }
      } catch (redirectErr: any) {
        throw new Error(
          redirectErr?.message || "Google Authentication failed via redirect."
        );
      }
    }
    throw new Error(popupErr?.message || "Google Authentication failed. Please check Firebase configuration.");
  }
}



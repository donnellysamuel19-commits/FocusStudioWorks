import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from "firebase/app-check";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = 
    !!(firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId);

const app = !getApps().length && isConfigValid ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

if (app && typeof window !== 'undefined') {
  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;

  if (debugToken) {
    // Use a custom provider that returns the debug token
    const debugProvider = new CustomProvider({
      getToken: () =>
        Promise.resolve({
          token: debugToken,
          expireTimeMillis: Date.now() + 60 * 60 * 1000, // Expires in 1 hour
        }),
    });
     initializeAppCheck(app, {
      provider: debugProvider,
      isTokenAutoRefreshEnabled: false, 
    });
    console.log("App Check initialized with explicit debug token.");
  } else {
    // Fallback to reCAPTCHA if no debug token is provided
    const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn("App Check Site Key or Debug Token is missing. AI calls might fail with 400 errors.");
      // This line can help you find a new debug token if needed.
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
  }
}

if (process.env.NODE_ENV !== 'production' && !isConfigValid) {
    console.error("Firebase configuration is invalid. Please check your .env.local file.");
}

export { app, auth, db };

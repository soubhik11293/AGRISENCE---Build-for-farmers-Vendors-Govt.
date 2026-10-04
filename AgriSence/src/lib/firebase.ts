import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type User as FirebaseUser,
  type ConfirmationResult,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

function getRequiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }
  return value.trim();
}

const firebaseConfig = {
  apiKey: getRequiredFirebaseEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getRequiredFirebaseEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getRequiredFirebaseEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredFirebaseEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredFirebaseEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredFirebaseEnv("VITE_FIREBASE_APP_ID"),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const EMAILJS_CONFIG = {
  serviceId: 'service_f97gcpm',
  templateId: 'template_m8vffmp',
  supportTemplateId: 'template_pvxsd4m',
  publicKey: 'JPuEUavSIs3Wtt-QG',
};

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
};
export type { FirebaseUser, ConfirmationResult };

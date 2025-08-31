// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Replace this with your own Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ9Aw0KQ0moKCDaNgCpKYt3VTOPtfToP0",
  authDomain: "voice-shopping-9c109.firebaseapp.com",
  projectId: "voice-shopping-9c109",
  storageBucket: "voice-shopping-9c109.firebasestorage.app",
  messagingSenderId: "88567791308",
  appId: "1:88567791308:web:dd0635fc502bb0e0500c69",
  measurementId: "G-LFR472PE52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Database
export const db = getFirestore(app);

// Authentication
export const auth = getAuth(app);

// Sign in anonymously
export async function initAuth() {
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");
  } catch (error) {
    console.error("Authentication error:", error);
  }
}

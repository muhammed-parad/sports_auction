import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "auction-hsl.firebaseapp.com",
  databaseURL: "https://auction-hsl-default-rtdb.firebaseio.com",
  projectId: "auction-hsl",
  storageBucket: "auction-hsl.firebasestorage.app",
  messagingSenderId: "1055955419800",
  appId: "1:1055955419800:web:e9b63300a5a0001157c6ed",
  measurementId: "G-EFFB14EJKY"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

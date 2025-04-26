import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "video-conferencing-fc429.firebaseapp.com",
  projectId: "video-conferencing-fc429",
  storageBucket: "video-conferencing-fc429.appspot.com",
  messagingSenderId: "1000040371466",
  appId: "1:1000040371466:web:3daf1750d4c4491a5616f3",
  measurementId: "G-29W28XYVJD"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firebaseDB = getFirestore(app);

export const usersRef = collection(firebaseDB, "users");
export const meetingsRef = collection(firebaseDB, "meetings");

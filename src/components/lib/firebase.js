import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "messenger-121f4.firebaseapp.com",
  projectId: "messenger-121f4",
  storageBucket: "messenger-121f4.appspot.com",
  messagingSenderId: "239101734110",
  appId: "1:239101734110:web:af1ae6d9f854e561ef264f",
  measurementId: "G-57YES7ZB31"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const db = getFirestore(app);
export const storage = getStorage(app);

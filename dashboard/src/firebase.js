import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADsBIPbaMQXyhEwc7F4zDjp9IfW-AD6-o",
  authDomain: "code-crop-6ce23.firebaseapp.com",
  projectId: "code-crop-6ce23",
  storageBucket: "code-crop-6ce23.firebasestorage.app",
  messagingSenderId: "981936119316",
  appId: "1:981936119316:web:2d90d8ecc3095375b19101"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYiPGyvSnfTyETzO6_58Pn7vL3lCU4SEk",
  authDomain: "cricket-turf-booking-52901.firebaseapp.com",
  projectId: "cricket-turf-booking-52901",
  storageBucket: "cricket-turf-booking-52901.firebasestorage.app",
  messagingSenderId: "654131674787",
  appId: "1:654131674787:web:cee6d73dd720f062cd4916",
  measurementId: "G-7273MRY8L0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firebase Auth & Firestore methods for uniform imports
export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
};

// Helper: Safely resolve turf image URL (handles filenames, relative paths, full URLs)
export function resolveImageUrl(imageName) {
    if (!imageName || typeof imageName !== 'string' || imageName.trim() === '') {
        return 'images/img 1.jpg';
    }
    const clean = imageName.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
        return clean;
    }
    if (clean.startsWith('images/')) {
        return clean;
    }
    return `images/${clean}`;
}
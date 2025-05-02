import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from "firebase/firestore";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCyYPyMikhSkpMdA_qzFNnB7KsQuhXTUTQ",
    authDomain: "team-project-11ca9.firebaseapp.com",
    projectId: "team-project-11ca9",
    storageBucket: "team-project-11ca9.appspot.com",
    messagingSenderId: "30724674184",
    appId: "1:30724674184:web:4d9e4821a69741c859c53d",
    measurementId: "G-R0ZH70WQJ7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Експортуємо всі необхідні функції Firestore
export {
    db,
    auth,
    provider,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};
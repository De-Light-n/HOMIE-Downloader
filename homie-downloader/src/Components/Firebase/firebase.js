import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Додаткові налаштування провайдера Google
provider.setCustomParameters({
    prompt: 'select_account'
});

// Експортуємо всі необхідні функції
export {
    // Основні експорти
    db,
    auth,
    storage,
    provider,
    serverTimestamp,

    // Функції Firestore
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,

    // Функції автентифікації
    signInWithEmailAndPassword,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,

    // Функції Storage
    ref,
    uploadBytes,
    getDownloadURL
};
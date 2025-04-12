// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDapc9H6S_urEagRMkjvoQ7NPuCbo5qrZw",
    authDomain: "mewzik-48897.firebaseapp.com",
    databaseURL: "https://mewzik-48897-default-rtdb.firebaseio.com",
    projectId: "mewzik-48897",
    storageBucket: "mewzik-48897.firebasestorage.app",
    messagingSenderId: "186531671819",
    appId: "1:186531671819:web:a108a2855475b192303c0e",
    measurementId: "G-MFR09X8KNB"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  // Add your Firebase config here
 apiKey: "AIzaSyBYSbcKLeQef0YlKdnOYKyc79kNzZoU-vQ",
  authDomain: "gigglo.firebaseapp.com",
  databaseURL: "https://gigglo-default-rtdb.firebaseio.com",
  projectId: "gigglo",
  storageBucket: "gigglo.firebasestorage.app",
  messagingSenderId: "270214641330",
  appId: "1:270214641330:web:c14248dfea7c7a32933bab",
  measurementId: "G-81S8L0QTM0"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export default app
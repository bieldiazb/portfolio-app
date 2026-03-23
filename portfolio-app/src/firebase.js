import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB47ZCdsA_msZMxYV_dX6PCXUiMcA-ogP0",
  authDomain: "portfolio-app-a80e4.firebaseapp.com",
  projectId: "portfolio-app-a80e4",
  storageBucket: "portfolio-app-a80e4.firebasestorage.app",
  messagingSenderId: "346462552494",
  appId: "1:346462552494:web:8bc4faed05d46e93c1083f"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)

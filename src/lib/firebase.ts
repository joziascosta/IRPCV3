// ─── Firebase Config ─────────────────────────────────────────────────────────
// Substitua pelos dados do SEU projeto em console.firebase.google.com
// Enquanto não configurado, o sistema roda em Modo Demonstração (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAh2R7sWoaz4a7HL4N_u7M9FX906zZhvyo",
  authDomain: "irpv-v3.firebaseapp.com",
  projectId: "irpv-v3",
  storageBucket: "irpv-v3.firebasestorage.app",
  messagingSenderId: "770612702184",
  appId: "1:770612702184:web:fd57be1955959f61c1d25d"
}

// Detecta modo demo ANTES de inicializar o Firebase
export const isDemoMode = firebaseConfig.apiKey === "SUA_API_KEY"

// Inicializa Firebase apenas se configurado — evita erros em modo demo
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const app = isDemoMode ? null : initializeApp(firebaseConfig)
export const auth = isDemoMode ? null : getAuth(app!)
export const db   = isDemoMode ? null : getFirestore(app!)




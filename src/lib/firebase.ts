
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Configuração do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAh2R7sWoaz4a7HL4N_u7M9FX906zZhvyo",
  authDomain: "irpv-v3.firebaseapp.com",
  projectId: "irpv-v3",
  storageBucket: "irpv-v3.firebasestorage.app",
  messagingSenderId: "770612702184",
  appId: "1:770612702184:web:fd57be1955959f61c1d25d"
}

// Ativa o modo demonstração somente quando a chave
// ainda contém o valor de exemplo
export const isDemoMode = firebaseConfig.apiKey === "SUA_API_KEY"

// Inicializa os serviços Firebase
const app = isDemoMode ? null : initializeApp(firebaseConfig)

export const auth = isDemoMode ? null : getAuth(app!)
export const db = isDemoMode ? null : getFirestore(app!)

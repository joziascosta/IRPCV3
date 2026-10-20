import { useState, useEffect } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  sendPasswordResetEmail, deleteUser, EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { collection, getDocs, deleteDoc, query, where } from 'firebase/firestore'
import { auth, db, isDemoMode } from '../lib/firebase'
import { traduzirErro } from '../lib/calc'

export interface AppUser {
  uid: string; email: string | null; displayName: string | null
}

const DEMO_USER: AppUser = { uid:'demo', email:'demo@irpc.local', displayName:'Modo Demonstração' }

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) { setUser(DEMO_USER); setLoading(false); return }
    const unsub = onAuthStateChanged(auth!, u => {
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string): Promise<string|null> => {
    if (isDemoMode) { setUser(DEMO_USER); return null }
    try { await signInWithEmailAndPassword(auth!, email, password); return null }
    catch (e: any) { return traduzirErro(e.code) }
  }

  const register = async (name: string, email: string, password: string): Promise<string|null> => {
    if (isDemoMode) return 'Configure o Firebase para criar contas reais.'
    if (!name.trim()) return 'Informe o nome completo.'
    try {
      const cred = await createUserWithEmailAndPassword(auth!, email, password)
      await updateProfile(cred.user, { displayName: name })
      setUser({ uid: cred.user.uid, email: cred.user.email, displayName: name })
      return null
    } catch (e: any) { return traduzirErro(e.code) }
  }

  const logout = async () => {
    if (isDemoMode) { setUser(null); return }
    await signOut(auth!)
  }

  const forgotPassword = async (email: string): Promise<string|null> => {
    if (isDemoMode) return 'Modo demonstração — não há e-mail real configurado.'
    try { await sendPasswordResetEmail(auth!, email); return null }
    catch (e: any) { return traduzirErro(e.code) }
  }

  const deleteAccount = async (password: string): Promise<string|null> => {
    if (isDemoMode) { setUser(null); return null }
    if (!auth?.currentUser) return 'Usuário não autenticado.'
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, password)
      await reauthenticateWithCredential(auth.currentUser, credential)
      if (db && auth.currentUser) {
        const uid = auth.currentUser.uid
        const snap = await getDocs(query(collection(db, 'avaliacoes'), where('uid', '==', uid)))
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
      }
      await deleteUser(auth.currentUser)
      setUser(null)
      return null
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        return 'Senha incorreta. Confirme sua senha para excluir a conta.'
      return traduzirErro(e.code)
    }
  }

  return { user, loading, isDemoMode, login, register, logout, forgotPassword, deleteAccount }
}

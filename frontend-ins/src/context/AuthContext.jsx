import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('attendify_user')) || null }
    catch { return null }
  })

  function login(userData, remember) {
    if (remember) localStorage.setItem('attendify_user', JSON.stringify(userData))
    // remember yoksa sadece React state'te tut — storage'a yazma
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('attendify_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { Router } from 'preact-router'
import { useState, useEffect } from 'preact/hooks'
import { Analytics } from '@vercel/analytics/react'
import { auth, db } from './firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

// Components
import BottomNavbar from './components/BottomNavbar'
import ParticleBackground from './components/ParticleBackground'

// Pages
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import ChatRoom from './pages/ChatRoom'
import Confess from './pages/Confess'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'

export function App() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
          <p className="text-neon-blue">Loading Gigglo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white relative">
      <ParticleBackground />
      
      <main className="relative z-10 pb-20">
        <Router>
          <Home path="/" user={user} userData={userData} />
          <Signup path="/signup" />
          <Login path="/login" />
          <ChatRoom path="/chat" user={user} userData={userData} />
          <Confess path="/confess" user={user} userData={userData} />
          <Profile path="/profile" user={user} userData={userData} />
          <AdminDashboard path="/admin" user={user} userData={userData} />
        </Router>
      </main>

      <BottomNavbar user={user} userData={userData} />

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  )
}

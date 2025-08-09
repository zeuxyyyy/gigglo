import { Link } from 'preact-router/match'
import { useState } from 'preact/hooks'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function BottomNavbar({ user, userData }) {
  const [showLogout, setShowLogout] = useState(false)

  if (!user || !userData?.isVerified) {
    return null // Don't show bottom nav for unverified users
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navItems = [
    {
      id: 'home',
      path: '/',
      icon: '🏠',
      label: 'Home',
      activeIcon: '🏡'
    },
    {
      id: 'chat',
      path: '/chat',
      icon: '💬',
      label: 'Chat',
      activeIcon: '💭'
    },
    {
      id: 'confess',
      path: '/confess',
      icon: '📝',
      label: 'Confess',
      activeIcon: '📋'
    },
    {
      id: 'profile',
      path: '/profile',
      icon: '👤',
      label: 'Profile',
      activeIcon: '👥'
    }
  ]

  // Add admin tab if user is admin
  if (userData?.isAdmin) {
    navItems.push({
      id: 'admin',
      path: '/admin',
      icon: '⚙️',
      label: 'Admin',
      activeIcon: '🛡️'
    })
  }

  return (
    <>
      {/* Logout Modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glassmorphism rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-xl font-bold mb-2">Logout</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogout(false)}
                className="btn-secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-dark-card/95 backdrop-blur-lg border-t border-gray-700">
          <div className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 ${
                  window.location.pathname === item.path
                    ? 'text-neon-pink scale-110 bg-neon-pink/10'
                    : 'text-gray-400 hover:text-white hover:scale-105 hover:bg-white/5'
                }`}
              >
                <div className="text-2xl mb-1">
                  {window.location.pathname === item.path ? item.activeIcon : item.icon}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {window.location.pathname === item.path && (
                  <div className="w-1 h-1 bg-neon-pink rounded-full mt-1"></div>
                )}
              </Link>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={() => setShowLogout(true)}
              className="flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 text-gray-400 hover:text-red-400 hover:scale-105 hover:bg-red-500/10"
            >
              <div className="text-2xl mb-1">🚪</div>
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
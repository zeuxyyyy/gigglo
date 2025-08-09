import { Link } from 'preact-router/match'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function Home({ user, userData }) {
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header with Logo and User Info */}
      <div className="pt-8 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neon-pink via-neon-violet to-neon-blue bg-clip-text text-transparent">
                Gigglo
              </h1>
              <p className="text-gray-400 mt-2">Anonymous student chat</p>
            </div>
            
            {user && userData?.isVerified && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="text-neon-blue font-semibold">@{userData.username}</p>
                <div className="flex items-center justify-end mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400">Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4">
        <div className="text-center max-w-4xl mx-auto">
          {!user && (
            <>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
                The anonymous chat app exclusively for verified students. 
                Connect, confess, and vibe with your peers safely.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                  🎓 Join as Student
                </Link>
                <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                  🔑 Login
                </Link>
              </div>
            </>
          )}

          {user && !userData?.isVerified && (
            <div className="glassmorphism rounded-2xl p-8 mb-8">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Verification Pending</h2>
              <p className="text-gray-400 mb-6">
                Your account is under review. You'll be able to access all features once verified by our admin team.
              </p>
              <Link href="/profile" className="btn-secondary">
                View Profile
              </Link>
            </div>
          )}

          {user && userData?.isVerified && (
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Link href="/chat" className="glassmorphism rounded-2xl p-8 hover:scale-105 transition-transform">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-neon-pink mb-2">Start Giggling</h3>
                <p className="text-gray-400">Connect with random verified students anonymously</p>
              </Link>
              
              <Link href="/confess" className="glassmorphism rounded-2xl p-8 hover:scale-105 transition-transform">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-neon-violet mb-2">Anonymous Confess</h3>
                <p className="text-gray-400">Share your thoughts anonymously with the community</p>
              </Link>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="glassmorphism rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2 text-neon-blue">Student Verified</h3>
              <p className="text-gray-400">Only verified students with valid ID cards can join</p>
            </div>
            
            <div className="glassmorphism rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">👻</div>
              <h3 className="text-xl font-semibold mb-2 text-neon-pink">Anonymous Chat</h3>
              <p className="text-gray-400">Chat randomly with other students while staying completely anonymous</p>
            </div>
            
            <div className="glassmorphism rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">💭</div>
              <h3 className="text-xl font-semibold mb-2 text-neon-violet">Safe Space</h3>
              <p className="text-gray-400">Report system and moderation keep conversations respectful</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
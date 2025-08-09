import { useState, useEffect } from 'preact/hooks'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Profile({ user }) {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Please login to view your profile</p>
          <a href="/login" className="btn-primary mt-4 inline-block">Login</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent">
          Your Profile
        </h1>

        <div className="glassmorphism rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Account Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              userData?.isVerified 
                ? 'bg-green-500/20 text-green-400 border border-green-500' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
            }`}>
              {userData?.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
            </div>
          </div>

          {!userData?.isVerified && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-400 mb-2">Verification Pending</h3>
              <p className="text-sm text-gray-300">
                Your account is under review. You'll be able to access chat and confession features once verified by our admin team.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <p className="text-white">{userData?.fullName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <p className="text-white">@{userData?.username}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <p className="text-white">{userData?.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
              <p className="text-white capitalize">{userData?.gender}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">College</label>
              <p className="text-white">{userData?.collegeName}</p>
            </div>
          </div>

          {userData?.studentIdUrl && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Uploaded Student ID</label>
              <img 
                src={userData.studentIdUrl} 
                alt="Student ID" 
                className="max-w-xs rounded-lg border border-gray-600"
              />
            </div>
          )}
        </div>

        <div className="glassmorphism rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-pink">
                {userData?.chatCount || 0}
              </div>
              <div className="text-sm text-gray-400">Chats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-blue">
                {userData?.confessionCount || 0}
              </div>
              <div className="text-sm text-gray-400">Confessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-violet">
                {userData?.likesReceived || 0}
              </div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {userData?.createdAt ? Math.floor((new Date() - userData.createdAt.toDate()) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-sm text-gray-400">Days</div>
            </div>
          </div>
        </div>

        <div className="glassmorphism rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {userData?.isVerified ? (
              <>
                <a href="/chat" className="btn-primary text-center block py-3">
                  🚀 Start Chatting
                </a>
                <a href="/confess" className="btn-secondary text-center block py-3">
                  📝 Write Confession
                </a>
              </>
            ) : (
              <div className="md:col-span-2 text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">⏳</div>
                <p>Actions will be available after verification</p>
                <p className="text-sm mt-2">Please wait for admin approval</p>
              </div>
            )}
          </div>
        </div>

        {userData?.isAdmin && (
          <div className="glassmorphism rounded-xl p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Admin Panel</h2>
            <a href="/admin" className="btn-primary block text-center py-3">
              🛡️ Access Admin Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
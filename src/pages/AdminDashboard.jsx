import { useState, useEffect } from 'preact/hooks'
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function AdminDashboard({ user }) {
  const [userData, setUserData] = useState(null)
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    if (user) {
      checkAdminAccess()
    }
  }, [user])

  const checkAdminAccess = async () => {
    try {
      // Get user data directly by UID
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserData(userData)
        
        if (userData.isAdmin) {
          fetchPendingUsers()
          fetchAllUsers()
        }
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingUsers = () => {
    const q = query(collection(db, 'users'), where('isVerified', '==', false))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPendingUsers(usersList)
    })

    return unsubscribe
  }

  const fetchAllUsers = () => {
    const q = query(collection(db, 'users'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAllUsers(usersList)
    })

    return unsubscribe
  }

  const verifyUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'verifying' }))
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: user.uid
      })
      
      console.log('User verified successfully:', userId)
      alert('✅ User verified successfully!')
    } catch (error) {
      console.error('Error verifying user:', error)
      alert('❌ Failed to verify user: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }))
    }
  }

  const rejectUser = async (userId) => {
    if (!confirm('Are you sure you want to reject this user?')) return
    
    setActionLoading(prev => ({ ...prev, [userId]: 'rejecting' }))
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: false,
        rejectedAt: new Date(),
        rejectedBy: user.uid
      })
      
      console.log('User rejected:', userId)
      alert('❌ User verification rejected')
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Failed to reject user: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }))
    }
  }

  const toggleAdminStatus = async (userId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return
    
    setActionLoading(prev => ({ ...prev, [userId]: 'updating' }))
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus,
        adminUpdatedAt: new Date(),
        adminUpdatedBy: user.uid
      })
      
      alert(`Admin status ${!currentStatus ? 'granted' : 'removed'} successfully!`)
    } catch (error) {
      console.error('Error updating admin status:', error)
      alert('Failed to update admin status: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glassmorphism rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userData?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glassmorphism rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">You don't have admin privileges</p>
          <a href="/" className="btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="glassmorphism rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-neon-blue">{allUsers.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{allUsers.filter(u => u.isVerified).length}</div>
            <div className="text-sm text-gray-400">Verified</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendingUsers.length}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
          <div className="glassmorphism rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{allUsers.filter(u => u.isAdmin).length}</div>
            <div className="text-sm text-gray-400">Admins</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="glassmorphism rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Pending Verifications ({pendingUsers.length})
          </h2>
          
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-gray-400">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-dark-card rounded-lg p-4 border border-gray-700">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-white text-lg">{user.fullName}</h3>
                      <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
                        <p className="text-gray-400"><span className="text-neon-blue">Username:</span> @{user.username}</p>
                        <p className="text-gray-400"><span className="text-neon-blue">Email:</span> {user.email}</p>
                        <p className="text-gray-400"><span className="text-neon-blue">College:</span> {user.collegeName}</p>
                        <p className="text-gray-400"><span className="text-neon-blue">Gender:</span> {user.gender}</p>
                        <p className="text-gray-400"><span className="text-neon-blue">Joined:</span> {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {user.studentIdUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Student ID:</label>
                          <img 
                            src={user.studentIdUrl} 
                            alt="Student ID" 
                            className="max-w-full h-32 object-cover rounded border border-gray-600 cursor-pointer"
                            onClick={() => window.open(user.studentIdUrl, '_blank')}
                          />
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyUser(user.id)}
                          disabled={actionLoading[user.id]}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition-colors flex-1"
                        >
                          {actionLoading[user.id] === 'verifying' ? '⏳ Verifying...' : '✅ Verify'}
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          disabled={actionLoading[user.id]}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 rounded text-white font-medium transition-colors flex-1"
                        >
                          {actionLoading[user.id] === 'rejecting' ? '⏳ Rejecting...' : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Users Management */}
        <div className="glassmorphism rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">All Users Management</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">College</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-gray-400 text-xs">@{user.username}</div>
                      </div>
                    </td>
                    <td className="p-2 text-gray-400">{user.email}</td>
                    <td className="p-2 text-gray-400">{user.collegeName}</td>
                    <td className="p-2">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        {user.isAdmin && (
                          <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                        disabled={actionLoading[user.id] || user.id === userData.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.isAdmin 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        } disabled:opacity-50`}
                      >
                        {actionLoading[user.id] === 'updating' ? '⏳' : user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
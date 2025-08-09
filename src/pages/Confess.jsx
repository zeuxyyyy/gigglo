import { useState, useEffect } from 'preact/hooks'
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Confess({ user }) {
  const [userData, setUserData] = useState(null)
  const [confessions, setConfessions] = useState([])
  const [newConfession, setNewConfession] = useState('')
  const [selectedTag, setSelectedTag] = useState('#rant')
  const [loading, setLoading] = useState(false)

  const tags = ['#crush', '#rant', '#quote', '#college', '#help']

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchConfessions()
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
    }
  }

  const fetchConfessions = () => {
    const q = query(collection(db, 'confessions'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const confessionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setConfessions(confessionsList)
    })

    return unsubscribe
  }

  const submitConfession = async (e) => {
    e.preventDefault()
    
    if (!newConfession.trim()) return
    if (!userData?.isVerified) {
      alert('You need to be verified to post confessions!')
      return
    }

    setLoading(true)

    try {
      await addDoc(collection(db, 'confessions'), {
        text: newConfession,
        tag: selectedTag,
        authorGender: userData.gender,
        authorCollege: userData.collegeName,
        likes: 0,
        comments: 0,
        createdAt: new Date(),
        likedBy: []
      })

      setNewConfession('')
      alert('Confession posted anonymously! 🎉')
    } catch (error) {
      console.error('Error posting confession:', error)
      alert('Failed to post confession. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Please login to view confessions</p>
          <a href="/login" className="btn-primary mt-4 inline-block">Login</a>
        </div>
      </div>
    )
  }

  if (!userData?.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">Verification Pending</h2>
          <p className="text-gray-400 mb-4">You need to be verified to access confession features</p>
          <a href="/profile" className="btn-secondary">View Profile</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent">
          Anonymous Confessions
        </h1>

        <div className="glassmorphism rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Share Your Thoughts</h2>
          
          <form onSubmit={submitConfession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Choose a tag</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag 
                        ? 'text-pink-400 bg-pink-500/20 border border-pink-400' 
                        : 'text-gray-400 bg-gray-500/20 hover:bg-gray-500/30'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={newConfession}
                onChange={(e) => setNewConfession(e.target.value)}
                placeholder="What's on your mind? Share anonymously..."
                className="input-field w-full h-32 resize-none"
                maxLength={500}
                required
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {newConfession.length}/500
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newConfession.trim()}
              className={`btn-primary w-full ${
                loading || !newConfession.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Posting...' : 'Post Anonymously'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {confessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-gray-400">No confessions yet. Be the first to share!</p>
            </div>
          ) : (
            confessions.map(confession => (
              <div key={confession.id} className="glassmorphism rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-pink-400 bg-pink-500/20">
                      {confession.tag}
                    </span>
                    <span className="text-sm text-gray-400">
                      {confession.authorGender} • {confession.authorCollege}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {confession.createdAt?.toDate ? new Date(confession.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                  </span>
                </div>

                <p className="text-gray-200 mb-4 leading-relaxed">
                  {confession.text}
                </p>

                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors">
                    <span className="text-lg">❤️</span>
                    <span>{confession.likes || 0}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import { ref, set, get, remove, onValue, off, push } from 'firebase/database'
import { rtdb } from '../firebase/config'
import ChatInput from '../components/ChatInput'

export default function ChatRoom({ user, userData }) {
  // Core state
  const [chatState, setChatState] = useState('idle') // idle, searching, matched, error
  const [partner, setPartner] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [messages, setMessages] = useState([])
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Refs for cleanup
  const messagesEndRef = useRef()
  const timerRef = useRef()
  const listenersRef = useRef(new Set())
  const searchTimeoutRef = useRef()

  // Cleanup function
  const cleanup = useCallback(async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Clear search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }

    // Remove all listeners
    listenersRef.current.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe()
        } catch (e) {
          console.warn('Error removing listener:', e)
        }
      }
    })
    listenersRef.current.clear()

    // Clean up Firebase data
    if (user?.uid) {
      try {
        await Promise.all([
          remove(ref(rtdb, `queue/${user.uid}`)),
          remove(ref(rtdb, `matches/${user.uid}`))
        ])
      } catch (e) {
        console.warn('Error cleaning up Firebase data:', e)
      }
    }
  }, [user?.uid])

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Start matching process
  const startMatching = useCallback(async () => {
    if (!userData?.isVerified) {
      setError('You need to be verified to start chatting!')
      return
    }

    if (chatState !== 'idle') return

    setChatState('searching')
    setError('')
    setConnectionStatus('searching')

    try {
      console.log('🔍 Starting match search for:', user.uid)

      // Check for existing users in queue
      const queueSnapshot = await get(ref(rtdb, 'queue'))
      const queueData = queueSnapshot.val() || {}
      
      // Find available users (excluding self)
      const availableUsers = Object.entries(queueData)
        .filter(([uid, data]) => 
          uid !== user.uid && 
          data && 
          Date.now() - data.timestamp < 30000 // Only users from last 30 seconds
        )

      if (availableUsers.length > 0) {
        // Match with first available user
        const [partnerUid, partnerData] = availableUsers[0]
        await createMatch(partnerUid, partnerData)
      } else {
        // Join queue and wait
        await joinQueue()
      }

    } catch (error) {
      console.error('❌ Error starting match:', error)
      setError('Failed to start matching. Please try again.')
      setChatState('idle')
      setConnectionStatus('disconnected')
    }
  }, [user?.uid, userData, chatState])

  // Join the waiting queue
  const joinQueue = useCallback(async () => {
    const queueRef = ref(rtdb, `queue/${user.uid}`)
    
    await set(queueRef, {
      uid: user.uid,
      username: userData.username,
      college: userData.collegeName,
      gender: userData.gender,
      timestamp: Date.now()
    })

    console.log('⏳ Joined queue, waiting for match...')

    // Listen for matches
    const matchRef = ref(rtdb, `matches/${user.uid}`)
    const unsubscribe = onValue(matchRef, async (snapshot) => {
      if (snapshot.exists()) {
        const matchData = snapshot.val()
        console.log('🎉 Match found:', matchData)
        
        setPartner(matchData.partner)
        setRoomId(matchData.roomId)
        setChatState('matched')
        setConnectionStatus('connected')
        
        // Remove from queue
        await remove(ref(rtdb, `queue/${user.uid}`))
        
        // Start chat
        startChat(matchData.roomId)
      }
    })

    listenersRef.current.add(unsubscribe)

    // Set timeout for search (30 seconds)
    searchTimeoutRef.current = setTimeout(() => {
      if (chatState === 'searching') {
        setError('No users found. Please try again later.')
        cancelSearch()
      }
    }, 30000)

  }, [user?.uid, userData, chatState])

  // Create match between two users
  const createMatch = useCallback(async (partnerUid, partnerData) => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    
    console.log('🔗 Creating match:', user.uid, '<->', partnerUid)

    const matchData1 = {
      roomId,
      partner: {
        uid: partnerUid,
        username: partnerData.username,
        college: partnerData.college,
        gender: partnerData.gender
      },
      createdAt: Date.now()
    }

    const matchData2 = {
      roomId,
      partner: {
        uid: user.uid,
        username: userData.username,
        college: userData.collegeName,
        gender: userData.gender
      },
      createdAt: Date.now()
    }

    // Create matches for both users atomically
    await Promise.all([
      set(ref(rtdb, `matches/${user.uid}`), matchData1),
      set(ref(rtdb, `matches/${partnerUid}`), matchData2),
      remove(ref(rtdb, `queue/${partnerUid}`)) // Remove partner from queue
    ])

    // Set local state
    setPartner(matchData1.partner)
    setRoomId(roomId)
    setChatState('matched')
    setConnectionStatus('connected')
    
    startChat(roomId)

  }, [user?.uid, userData])

  // Start chat session
  const startChat = useCallback((roomId) => {
    console.log('💬 Starting chat in room:', roomId)
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endChat()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Listen to messages
    const messagesRef = ref(rtdb, `chats/${roomId}/messages`)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val()
        const messagesList = Object.entries(messagesData)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => a.timestamp - b.timestamp)
        setMessages(messagesList)
      } else {
        setMessages([])
      }
    })

    listenersRef.current.add(unsubscribe)

  }, [])

  // Send message - Updated to accept parameter
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText || !roomId || chatState !== 'matched') return

    try {
      const messagesRef = ref(rtdb, `chats/${roomId}/messages`)
      await push(messagesRef, {
        text: messageText,
        sender: user.uid,
        timestamp: Date.now()
      })

      console.log('📤 Message sent:', messageText)
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setError('Failed to send message. Please try again.')
    }
  }, [roomId, user?.uid, chatState])

  // Send reaction
  const sendReaction = useCallback(async (emoji) => {
    if (!roomId || chatState !== 'matched') return

    try {
      const messagesRef = ref(rtdb, `chats/${roomId}/messages`)
      await push(messagesRef, {
        text: emoji,
        sender: user.uid,
        timestamp: Date.now(),
        isReaction: true
      })
    } catch (error) {
      console.error('❌ Error sending reaction:', error)
    }
  }, [roomId, user?.uid, chatState])

  // Cancel search
  const cancelSearch = useCallback(async () => {
    console.log('❌ Cancelling search...')
    await cleanup()
    setChatState('idle')
    setConnectionStatus('disconnected')
    setError('')
  }, [cleanup])

  // End chat
  const endChat = useCallback(async () => {
    console.log('🔚 Ending chat...')
    
    // Clean up chat data
    if (roomId) {
      try {
        // Don't delete messages immediately, let them expire naturally
        await remove(ref(rtdb, `matches/${user.uid}`))
      } catch (e) {
        console.warn('Error cleaning up match data:', e)
      }
    }

    await cleanup()
    
    // Reset state
    setChatState('idle')
    setPartner(null)
    setRoomId(null)
    setMessages([])
    setTimeLeft(300)
    setConnectionStatus('disconnected')
    setError('')
  }, [roomId, user?.uid, cleanup])

  // Skip to next chat
  const skipChat = useCallback(async () => {
    await endChat()
    // Small delay before starting new search
    setTimeout(() => {
      startMatching()
    }, 1000)
  }, [endChat, startMatching])

  // Extend chat time
  const extendChat = useCallback(() => {
    setTimeLeft(prev => prev + 300) // Add 5 minutes
    console.log('⏰ Chat extended by 5 minutes')
  }, [])

  // Format time display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Render guards
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glassmorphism rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">Please login to start chatting with other students</p>
          <a href="/login" className="btn-primary">Login Now</a>
        </div>
      </div>
    )
  }

  if (!userData?.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glassmorphism rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Verification Pending</h2>
          <p className="text-gray-400 mb-6">You need to be verified to access chat features</p>
          <a href="/profile" className="btn-secondary">View Profile</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-4 text-red-300 flex items-center">
            <span className="text-xl mr-3">⚠️</span>
            <div>
              <p className="font-medium">{error}</p>
              <button 
                onClick={() => setError('')}
                className="text-sm text-red-400 hover:text-red-300 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Idle State - Ready to start */}
        {chatState === 'idle' && (
          <div className="glassmorphism rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">💬</div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent">
              Ready to Gigglo?
            </h1>
            <p className="text-gray-400 mb-8 text-lg">
              Connect anonymously with verified students from other colleges
            </p>
            
            <button 
              onClick={startMatching}
              className="btn-primary text-xl px-12 py-4 hover:scale-105 transition-transform"
            >
              🚀 Start Giggling
            </button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>• Stay anonymous • 5-minute chats • Safe & verified</p>
            </div>
          </div>
        )}

        {/* Searching State */}
        {chatState === 'searching' && (
          <div className="glassmorphism rounded-2xl p-8 text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-neon-pink border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl">🔍</div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-neon-blue mb-2">Finding your chatmate...</h2>
            <p className="text-gray-400 mb-2">Searching for another verified student</p>
            <p className="text-sm text-gray-500 mb-6">This usually takes 10-30 seconds</p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={cancelSearch}
                className="btn-secondary"
              >
                Cancel Search
              </button>
            </div>
          </div>
        )}

        {/* Matched State - Active Chat */}
        {chatState === 'matched' && (
          <div className="glassmorphism rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-dark-card to-gray-800 p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-r from-neon-pink to-neon-violet rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-card"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Anonymous Student</h3>
                    <p className="text-sm text-gray-400">{partner?.college}</p>
                    <p className="text-xs text-green-400">🟢 Connected</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-xl font-mono ${
                      timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-neon-blue'
                    }`}>
                      ⏰ {formatTime(timeLeft)}
                    </div>
                    <p className="text-xs text-gray-400">Time left</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {timeLeft < 60 && (
                      <button 
                        onClick={extendChat}
                        className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Extend chat by 5 minutes"
                      >
                        +5min
                      </button>
                    )}
                    <button 
                      onClick={skipChat}
                      className="btn-secondary text-sm px-3 py-1"
                      title="End this chat and find someone new"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-dark-card/10">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">👋</div>
                  <h3 className="text-xl font-semibold mb-2">Say Hello!</h3>
                  <p className="text-gray-400">Start the conversation with your anonymous chatmate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl shadow-lg ${
                          message.sender === user.uid
                            ? 'bg-gradient-to-r from-neon-pink to-neon-violet text-white'
                            : 'bg-dark-card text-gray-200 border border-gray-600'
                        } ${message.isReaction ? 'text-3xl px-3 py-1' : ''}`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick Reactions */}
            <div className="bg-dark-card border-t border-gray-700 p-3">
              <div className="flex justify-center space-x-4 mb-3">
                {['🔥', '😂', '❤️', '😢', '😮', '👍', '🤔', '😎'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform duration-200 hover:drop-shadow-lg"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed Message Input Component */}
            <ChatInput 
              onSendMessage={sendMessage}
              disabled={chatState !== 'matched'}
              placeholder="Type your message..."
            />

            {/* Chat Footer Actions */}
            <div className="bg-gradient-to-r from-gray-800 to-dark-card p-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => sendReaction('👍')}
                    className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 px-3 py-2 rounded-lg transition-colors"
                    title="Send a like"
                  >
                    <span>👍</span>
                    <span className="text-sm">Like</span>
                  </button>
                  
                  <button 
                    className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-lg transition-colors"
                    title="Report inappropriate behavior"
                  >
                    <span>🚩</span>
                    <span className="text-sm">Report</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-400">
                    💬 Chat expires in 24hrs
                  </div>
                  <button 
                    onClick={endChat}
                    className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg text-red-400 font-medium transition-colors"
                    title="End this chat session"
                  >
                    End Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="flex justify-center mt-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
            connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
            connectionStatus === 'searching' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'searching' ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'searching' ? 'Searching' :
               'Disconnected'}
            </span>
          </div>
        </div>

        
        
      </div>
    </div>
  )
}
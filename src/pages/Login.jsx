import { useState } from 'preact/hooks'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { route } from 'preact-router'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      route('/')
    } catch (error) {
      console.error('Login error:', error)
      
      // More specific error messages
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent mb-2">
              Gigglo
            </h1>
            <p className="text-gray-500 text-sm">Anonymous Student Chat</p>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400">Login to continue giggling with your peers</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glassmorphism rounded-2xl p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300 text-sm">
              <div className="flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="your.email@college.edu"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
              loading || !formData.email || !formData.password
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'btn-primary hover:scale-105'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login to Gigglo'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <a href="/signup" className="text-neon-blue hover:text-neon-pink transition-colors font-semibold">
              Sign up here
            </a>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 glassmorphism rounded-xl p-4">
          <h3 className="text-center font-semibold mb-3 text-gray-300">Why Gigglo?</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl mb-1">🛡️</div>
              <p className="text-xs text-gray-400">Verified Students Only</p>
            </div>
            <div>
              <div className="text-2xl mb-1">👻</div>
              <p className="text-xs text-gray-400">Anonymous Chat</p>
            </div>
            <div>
              <div className="text-2xl mb-1">💭</div>
              <p className="text-xs text-gray-400">Safe Space</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
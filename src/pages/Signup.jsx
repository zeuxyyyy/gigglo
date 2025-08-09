import { useState } from 'preact/hooks'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { route } from 'preact-router'

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    gender: '',
    collegeName: '',
    studentId: null
  })
  
  const [checkboxes, setCheckboxes] = useState({
    ageConfirm: false,
    idConfirm: false,
    infoMatch: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setCheckboxes(prev => ({ ...prev, [name]: checked }))
  }

  const uploadToImgBB = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=bca16fc0545ea79a458a831b985fbbf1`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        return data.data.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      throw new Error('Failed to upload image')
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadToImgBB(file)
      setFormData(prev => ({ ...prev, studentId: imageUrl }))
      setError('')
    } catch (error) {
      setError('Failed to upload student ID. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const canSubmit = () => {
    return Object.values(checkboxes).every(Boolean) && 
           formData.studentId && 
           Object.values(formData).every(val => val !== '' && val !== null)
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!canSubmit()) {
    setError('Please fill all fields and complete verification requirements')
    return
  }

  setLoading(true)
  setError('')

  try {
    console.log('Creating user account...')
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    )
    
    console.log('User created:', userCredential.user.uid)
    
    // Save user data to Firestore
    const userData = {
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      gender: formData.gender,
      collegeName: formData.collegeName,
      studentIdUrl: formData.studentId,
      isVerified: false,
      isAdmin: false,
      createdAt: new Date(),
      lastActive: new Date(),
      chatCount: 0,
      confessionCount: 0,
      likesReceived: 0
    }
    
    console.log('Saving user data to Firestore...', userData)
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData)
    
    console.log('User data saved successfully!')
    
    alert('Account created successfully! Please wait for admin verification.')
    route('/profile')
    
  } catch (error) {
    console.error('Signup error:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    // More specific error messages
    if (error.code === 'auth/email-already-in-use') {
      setError('This email is already registered. Please use a different email.')
    } else if (error.code === 'auth/weak-password') {
      setError('Password should be at least 6 characters long.')
    } else if (error.code === 'auth/invalid-email') {
      setError('Please enter a valid email address.')
    } else {
      setError(`Registration failed: ${error.message}`)
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-pink to-neon-violet bg-clip-text text-transparent mb-2">
            Join Gigglo
          </h1>
          <p className="text-gray-400">Student verification required</p>
        </div>

        <form onSubmit={handleSubmit} className="glassmorphism rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Choose a unique username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="your.email@college.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="input-field w-full"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">College Name</label>
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Your college/university name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Student ID Card</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input-field w-full"
              required
            />
            {uploading && (
              <p className="text-neon-blue text-sm mt-1">Uploading...</p>
            )}
            {formData.studentId && (
              <p className="text-green-400 text-sm mt-1">✅ ID uploaded successfully</p>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="ageConfirm"
                checked={checkboxes.ageConfirm}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-neon-pink bg-dark-card border-gray-600 rounded focus:ring-neon-pink"
              />
              <span className="text-sm">I am 14+ years old</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="idConfirm"
                checked={checkboxes.idConfirm}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-neon-pink bg-dark-card border-gray-600 rounded focus:ring-neon-pink"
              />
              <span className="text-sm">Uploading a valid student ID card is mandatory</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="infoMatch"
                checked={checkboxes.infoMatch}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-neon-pink bg-dark-card border-gray-600 rounded focus:ring-neon-pink"
              />
              <span className="text-sm">My info matches the ID card</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit() || loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
              canSubmit() && !loading
                ? 'btn-primary'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-neon-blue hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  )
}
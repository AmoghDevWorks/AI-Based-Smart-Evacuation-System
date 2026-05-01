import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

const SignUp = () => {
  const mode = useSelector((store) => store.theme.mode)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: null, success: false })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: null, success: false })

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to sign up')
      }
      
      setStatus({ loading: false, error: null, success: true })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false })
    }
  }

  const baseInputClass = `w-full px-4 py-3 rounded-lg outline-none transition-all border ${
    mode === 'light' 
      ? 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-400/50 focus:border-gray-500' 
      : 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-400'
  }`

  const labelClass = `block text-sm font-medium mb-1.5 ${mode === 'light' ? 'text-gray-700' : 'text-gray-300'}`

  return (
    <div className={`min-h-[calc(100vh-73px)] flex flex-col items-center justify-center p-4 w-full flex-1 ${mode === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${mode === 'light' ? 'border-gray-100 bg-white' : 'border-gray-800 bg-gray-900'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${mode === 'light' ? 'text-gray-900' : 'text-white'}`}>
          Create an Account
        </h2>
        
        {status.error && (
          <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm text-center">
            {status.error}
          </div>
        )}
        
        {status.success && (
          <div className="mb-6 p-3 rounded-lg border border-green-200 bg-green-50 text-green-600 text-sm text-center">
            Account created! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <input 
              type="text" 
              name="name"
              required 
              value={formData.name}
              onChange={handleChange}
              className={baseInputClass}
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className={labelClass}>Email Address</label>
            <input 
              type="email" 
              name="email"
              required 
              value={formData.email}
              onChange={handleChange}
              className={baseInputClass}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input 
              type="password" 
              name="password"
              required 
              value={formData.password}
              onChange={handleChange}
              className={baseInputClass}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={status.loading || status.success}
            className={`w-full mt-2 block px-6 py-3 font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {status.loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className={`mt-8 text-center pt-6 border-t ${mode === 'light' ? 'border-gray-100' : 'border-gray-800'}`}>
          <p className={`text-sm mb-2 ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Already have an account?</p>
          <Link to="/login" className={`font-semibold hover:underline decoration-2 underline-offset-4 transition-colors ${mode === 'light' ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'}`}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp
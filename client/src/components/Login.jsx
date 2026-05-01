import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { setUser } from '../utils/userSlice'

const Login = () => {
  const mode = useSelector((store) => store.theme.mode)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // Simulate an API call delay for mock login
    setTimeout(() => {
      dispatch(setUser({
        user: { name: 'Admin', role: 'Security' },
        token: 'mock-jwt-token'
      }))
      navigate('/')
    }, 1000)
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
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Email Address</label>
            <input 
              type="email" 
              name="email"
              required 
              value={formData.email}
              onChange={handleChange}
              className={baseInputClass}
              placeholder="admin@smartevac.com"
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
            disabled={loading}
            className={`w-full mt-2 block px-6 py-3 font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className={`mt-8 text-center pt-6 border-t ${mode === 'light' ? 'border-gray-100' : 'border-gray-800'}`}>
          <p className={`text-sm mb-2 ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Don't have an account?</p>
          <Link to="/signup" className={`font-semibold hover:underline decoration-2 underline-offset-4 transition-colors ${mode === 'light' ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'}`}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
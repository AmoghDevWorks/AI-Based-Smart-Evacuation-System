import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'

const Home = () => {
  const isAuthenticated = useSelector((store) => store.user.isAuthenticated)
  const mode = useSelector((store) => store.theme.mode)

  if (isAuthenticated) {
    return <Hero />
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center font-sans p-4 w-full">
      <div className="max-w-4xl w-full">
        <h1 className={`text-4xl md:text-5xl font-extrabold mb-12 text-center ${mode === 'light' ? 'text-black' : 'text-white'}`}>
          Welcome to Smart Evac
        </h1>

        <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
          {/* Login Card */}
          <div className={`flex-1 flex flex-col p-8 text-center transition-all duration-300 rounded-2xl shadow-lg hover:-translate-y-2 hover:shadow-xl ${mode === 'light' ? 'bg-white border border-gray-100' : 'bg-gray-900 border border-gray-800'}`}>
            <h2 className={`text-2xl font-bold mb-4 pb-4 border-b ${mode === 'light' ? 'border-gray-200 text-gray-800' : 'border-gray-700 text-gray-100'}`}>
              Log In
            </h2>
            <p className={`mb-8 flex-1 text-base ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Already have an account? Access your dashboard and manage your settings.
            </p>
            <Link
              to="/login"
              className={`w-full block px-6 py-3 font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${mode === 'light' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              Go to Log In
            </Link>
          </div>

          {/* Signup Card */}
          <div className={`flex-1 flex flex-col p-8 text-center transition-all duration-300 rounded-2xl shadow-lg hover:-translate-y-2 hover:shadow-xl ${mode === 'light' ? 'bg-white border border-gray-100' : 'bg-gray-900 border border-gray-800'}`}>
            <h2 className={`text-2xl font-bold mb-4 pb-4 border-b ${mode === 'light' ? 'border-gray-200 text-gray-800' : 'border-gray-700 text-gray-100'}`}>
              Sign Up
            </h2>
            <p className={`mb-8 flex-1 text-base ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              New to the system? Create an account to get started with smart evacuation.
            </p>
            <Link
              to="/signup"
              className={`w-full block px-6 py-3 font-semibold rounded-lg transition-all duration-300 border ${mode === 'light' ? 'bg-transparent text-black border-black hover:bg-gray-50' : 'bg-transparent text-white border-white hover:bg-gray-800'}`}
            >
              Go to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
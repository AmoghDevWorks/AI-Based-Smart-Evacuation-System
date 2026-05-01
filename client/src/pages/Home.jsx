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
        <h1 className="text-4xl md:text-5xl font-bold mb-12 tracking-tight uppercase text-center">
          Welcome to Smart Evac
        </h1>
        
        <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
          {/* Login Card */}
          <div className={`flex-1 flex flex-col border-2 p-8 text-center transition-all duration-300 ${mode === 'light' ? 'border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]' : 'border-white bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]'}`}>
            <h2 className={`text-3xl font-bold mb-4 tracking-tight uppercase border-b-2 pb-4 ${mode === 'light' ? 'border-black' : 'border-white'}`}>Log In</h2>
            <p className={`mb-8 flex-1 text-lg font-medium ${mode === 'light' ? 'text-black' : 'text-gray-300'}`}>Already have an account? Access your dashboard and manage your settings.</p>
            <Link
              to="/login"
              className={`w-full block px-6 py-4 font-bold border-2 transition-colors duration-300 uppercase tracking-widest ${mode === 'light' ? 'bg-black text-white border-black hover:bg-white hover:text-black' : 'bg-white text-black border-white hover:bg-black hover:text-white'}`}
            >
              Go to Log In
            </Link>
          </div>

          {/* Signup Card */}
          <div className={`flex-1 flex flex-col border-2 p-8 text-center transition-all duration-300 ${mode === 'light' ? 'border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]' : 'border-white bg-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]'}`}>
            <h2 className={`text-3xl font-bold mb-4 tracking-tight uppercase border-b-2 pb-4 ${mode === 'light' ? 'border-black' : 'border-white'}`}>Sign Up</h2>
            <p className={`mb-8 flex-1 text-lg font-medium ${mode === 'light' ? 'text-black' : 'text-gray-300'}`}>New to the system? Create an account to get started with smart evacuation.</p>
            <Link
              to="/signup"
              className={`w-full block px-6 py-4 font-bold border-2 transition-colors duration-300 uppercase tracking-widest ${mode === 'light' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-black text-white border-white hover:bg-white hover:text-black'}`}
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
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '../utils/themeSlice'
import { Link } from 'react-router-dom'

const Navbar = ({ toggleSidebar }) => {
  const mode = useSelector((state) => state.theme.mode)
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated)
  const dispatch = useDispatch()

  if (!isAuthenticated) {
    return (
      <header className={`p-4 border-b-2 flex justify-between items-center transition-colors duration-300 ${mode === 'light' ? 'bg-white text-black border-black' : 'bg-black text-white border-white'}`}>
        <Link to="/" className="text-2xl font-bold tracking-widest uppercase">
          Smart Evac
        </Link>
        <button
          onClick={() => dispatch(toggleTheme())}
          className={`px-4 py-2 font-bold uppercase tracking-wider border-2 transition-colors duration-300 ${mode === 'light' ? 'bg-black text-white border-black hover:bg-white hover:text-black' : 'bg-white text-black border-white hover:bg-black hover:text-white'}`}
        >
          {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>
    )
  }

  return (
    <header className={`px-4 md:px-6 py-4 border-b flex justify-between items-center z-50 sticky top-0 h-[73px] transition-colors duration-300 ${mode === 'light' ? 'bg-white text-black border-gray-200' : 'bg-black text-white border-gray-800'}`}>
      <div className="flex items-center gap-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white p-1"
            aria-label="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="text-lg md:text-xl font-bold tracking-widest uppercase text-blue-400 hidden sm:block">
          Smart Evac
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-500 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] sm:text-xs font-semibold text-green-400 uppercase tracking-wider">Status: Normal</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="hidden sm:block text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
        >
          {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button
          onClick={() => dispatch(toggleTheme())}
          className="sm:hidden text-gray-400 hover:text-white p-1"
          aria-label="Toggle Theme"
        >
          {mode === 'light' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-black font-bold flex-shrink-0">
            A
          </div>
          <div className="flex-col hidden sm:flex">
            <span className="text-sm font-bold">Admin User</span>
            <span className="text-xs text-gray-400">Security Team</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
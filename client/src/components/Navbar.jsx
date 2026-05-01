import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '../utils/themeSlice'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const mode = useSelector((state) => state.theme.mode)
  const dispatch = useDispatch()

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

export default Navbar
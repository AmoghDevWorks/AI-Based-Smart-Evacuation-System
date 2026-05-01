import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Home from './pages/Home'
import Navbar from './components/Navbar'

const App = () => {
  const mode = useSelector((state) => state.theme.mode)

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${mode === 'light' ? 'bg-white text-black' : 'bg-black text-white'}`}>
      <BrowserRouter>
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  )
}

export default App
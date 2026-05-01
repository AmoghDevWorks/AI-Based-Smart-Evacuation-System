import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import LiveMonitoring from './pages/LiveMonitoring'
import BuildingLayout from './pages/BuildingLayout'
import AlertsLogs from './pages/AlertsLogs'
import Settings from './pages/Settings'
import Login from './components/Login'
import SignUp from './components/SignUp'

const App = () => {
  const mode = useSelector((state) => state.theme.mode)
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className={`h-screen overflow-hidden flex flex-col transition-colors duration-300 ${!isAuthenticated && mode === 'light' ? 'bg-white text-black' : 'bg-black text-white'}`}>
      <BrowserRouter>
        <Navbar toggleSidebar={toggleSidebar} />
        {isAuthenticated ? (
          <div className="flex-1 flex overflow-hidden relative">
            <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
            <main className={`flex-1 overflow-y-auto w-full relative z-0 ${mode === 'light' ? 'bg-gray-50 text-black' : 'bg-black text-white'}`}>
              <Routes>
                <Route path="/" element={<Hero />} />
                <Route path="/live" element={<LiveMonitoring />} />
                <Route path="/layout" element={<BuildingLayout />} />
                <Route path="/alerts" element={<AlertsLogs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        ) : (
          <main className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        )}
      </BrowserRouter>
    </div>
  )
}

export default App
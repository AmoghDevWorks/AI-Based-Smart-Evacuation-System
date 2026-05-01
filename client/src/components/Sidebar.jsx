import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation()
  const mode = useSelector((state) => state.theme.mode)

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/live', label: 'Live Monitoring' },
    { path: '/layout', label: 'Building Layout' },
    { path: '/alerts', label: 'Alerts & Logs' },
    { path: '/settings', label: 'Settings' },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-40 lg:hidden backdrop-blur-sm ${mode === 'light' ? 'bg-white/60' : 'bg-black/60'}`}
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar Content */}
      <aside 
        className={`fixed lg:static top-[73px] left-0 h-[calc(100vh-73px)] w-64 border-r flex flex-col overflow-y-auto z-50 transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${mode === 'light' ? 'bg-white border-gray-200 text-gray-700' : 'bg-black border-gray-800 text-gray-300'}
        `}
      >
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Main Menu</h2>
            <button onClick={closeSidebar} className="text-gray-400 hover:text-black p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="hidden lg:block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Main Menu</h2>
          
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeSidebar}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3
                    ${isActive 
                      ? (mode === 'light' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-blue-900/40 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(96,165,250,0.1)]')
                      : (mode === 'light' ? 'hover:bg-gray-100 hover:text-black' : 'hover:bg-gray-800 hover:text-white')}`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className={`mt-auto p-4 lg:p-6 border-t ${mode === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
          <button className={`w-full py-2 px-4 border rounded-lg font-bold uppercase tracking-wider transition-colors duration-200
            ${mode === 'light' ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-500 hover:text-white' : 'bg-red-900/30 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'}`}>
            Trigger Alarm
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const BuildingMap = () => {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)

  const [hasLayout, setHasLayout] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLayout = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const res = await fetch(`${API_URL}/api/layouts/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.nodes && data.nodes.length > 0) {
            setHasLayout(true)
          } else {
            setHasLayout(false)
          }
        }
      } catch (e) {
        console.error("Failed to fetch layout in dashboard", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLayout()
  }, [user])

  return (
    <div className={`border rounded-xl p-6 flex flex-col h-full relative overflow-hidden transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
      <div className="flex justify-between items-center mb-6 z-10 relative">
        <h3 className={`text-sm font-bold uppercase tracking-widest ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Building Layout</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className={`text-xs uppercase ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Safe</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className={`text-xs uppercase ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Risk</span></div>
        </div>
      </div>
      
      {/* SVG Canvas representing Building Map */}
      <div className={`flex-1 border rounded-lg flex items-center justify-center p-4 relative ${mode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/50 border-gray-800'}`}>
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
            <p className={`text-sm ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Loading layout...</p>
          </div>
        ) : !hasLayout ? (
          <div className="flex flex-col items-center text-center">
             <div className="text-4xl mb-3">🗺️</div>
             <p className={`text-base font-semibold ${mode === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>No Layout Configuration Found</p>
             <p className={`text-sm mt-2 max-w-xs ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>You need to map out your building before you can monitor live evacuation flows.</p>
          </div>
        ) : (
          <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-lg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={mode === 'light' ? '#e5e7eb' : '#1f2937'} strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Room A */}
            <rect x="50" y="50" width="100" height="80" rx="4" fill={mode === 'light' ? '#eff6ff' : '#0f172a'} stroke="#3b82f6" strokeWidth="2" />
            <text x="100" y="95" fill="#3b82f6" fontSize="14" fontWeight="bold" textAnchor="middle">LOBBY</text>
            
            {/* Corridor */}
            <rect x="150" y="70" width="80" height="40" fill={mode === 'light' ? '#fef2f2' : '#0f172a'} stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
            
            {/* Room B */}
            <rect x="230" y="30" width="120" height="120" rx="4" fill={mode === 'light' ? '#fee2e2' : '#450a0a'} stroke="#ef4444" strokeWidth="2" />
            <text x="290" y="95" fill="#ef4444" fontSize="14" fontWeight="bold" textAnchor="middle">HALLWAY A</text>

            {/* Connection Lines */}
            <path d="M 150 90 L 230 90" stroke="#ef4444" strokeWidth="4" strokeDasharray="4 4" className="animate-pulse" />
          </svg>
        )}
      </div>
    </div>
  )
}

export default BuildingMap

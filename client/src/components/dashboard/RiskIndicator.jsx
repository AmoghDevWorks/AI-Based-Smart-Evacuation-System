import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const RiskIndicator = () => {
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
    <div className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center h-full relative overflow-hidden transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
        </div>
      ) : !hasLayout ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="text-3xl mb-2 opacity-50">⚠️</div>
           <p className={`text-sm font-semibold ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>No active layout</p>
        </div>
      ) : (
        <>
          {/* Decorative background glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[50px] ${mode === 'light' ? 'bg-red-200' : 'bg-red-500/20'}`}></div>
          
          <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 z-10 relative ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>System Risk Level</h3>
          
          <div className="z-10 relative my-4">
            <div className={`text-6xl font-black tracking-tighter ${mode === 'light' ? 'text-red-600' : 'text-red-500'}`}>
              0.84
            </div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Score (0.0 - 1.0)</div>
          </div>
          
          <div className="z-10 relative w-full">
            <div className={`inline-block border font-bold uppercase tracking-widest px-6 py-2 rounded-full ${mode === 'light' ? 'bg-red-100 text-red-600 border-red-300 shadow-sm' : 'bg-red-900/40 text-red-400 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
              High Risk
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RiskIndicator

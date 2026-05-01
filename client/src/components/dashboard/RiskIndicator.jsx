import React from 'react'
import { useSelector } from 'react-redux'

const RiskIndicator = () => {
  const mode = useSelector((state) => state.theme.mode)

  return (
    <div className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center h-full relative overflow-hidden transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
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
    </div>
  )
}

export default RiskIndicator

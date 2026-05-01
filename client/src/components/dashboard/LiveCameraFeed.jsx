import React from 'react'
import { useSelector } from 'react-redux'

const LiveCameraFeed = () => {
  const mode = useSelector((state) => state.theme.mode)

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col relative h-full min-h-[300px] transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Live
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider ${mode === 'light' ? 'bg-white/80 backdrop-blur-sm border-gray-300 text-black' : 'bg-black/50 backdrop-blur-sm border-gray-600 text-white'}`}>
          Cam 01 - Main Lobby
        </span>
      </div>
      
      {/* Video Placeholder */}
      <div className={`flex-1 relative flex items-center justify-center ${mode === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
        {/* Simulate some "AI Vision" overlays */}
        <div className={`absolute inset-0 border-[1px] m-8 ${mode === 'light' ? 'border-blue-500/40' : 'border-blue-500/20'}`}>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
        </div>
        <div className={`font-mono text-sm ${mode === 'light' ? 'text-gray-500' : 'text-gray-700'}`}>[ NO VIDEO SIGNAL ]</div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <div className={`border rounded-lg p-3 text-right ${mode === 'light' ? 'bg-white/90 backdrop-blur-md border-blue-300 shadow-md' : 'bg-black/70 backdrop-blur-md border-blue-500/50'}`}>
          <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Detected People</div>
          <div className={`text-3xl font-black ${mode === 'light' ? 'text-black' : 'text-white'}`}>142</div>
        </div>
      </div>
    </div>
  )
}

export default LiveCameraFeed

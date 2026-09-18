import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const LiveCameraFeed = ({ analysis }) => {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)

  const [hasLayout, setHasLayout] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const primaryCamera = analysis?.cameras?.[0]
  const primaryMetrics = primaryCamera?.metrics
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const isRemoteUrl = primaryCamera?.device_id?.startsWith('http://') || primaryCamera?.device_id?.startsWith('https://')
  const streamUrl = primaryCamera?.device_id
    ? isRemoteUrl ? primaryCamera.device_id : `${API_URL}/api/camera/stream/${user?.id}/${primaryCamera.device_id}`
    : ''

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
      
      {isLoading ? (
        <div className={`flex-1 relative flex items-center justify-center flex-col ${mode === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
        </div>
      ) : !hasLayout ? (
        <div className={`flex-1 relative flex items-center justify-center flex-col text-center p-4 ${mode === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
           <div className="text-3xl mb-2 opacity-50">📹</div>
           <p className={`text-sm font-semibold ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>No active layout</p>
        </div>
      ) : (
        <>
          {/* Video Placeholder */}
          <div className={`flex-1 relative flex items-center justify-center ${mode === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
            {streamUrl && <img src={streamUrl} alt={`Live stream for ${primaryCamera?.label || 'camera'}`} className="absolute inset-0 h-full w-full object-cover" />}
            {/* Simulate some "AI Vision" overlays */}
            <div className={`absolute inset-0 border-[1px] m-8 ${mode === 'light' ? 'border-blue-500/40' : 'border-blue-500/20'}`}>
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
            </div>
            <div className={`z-10 font-mono text-sm ${streamUrl ? 'bg-black/60 px-2 py-1 text-gray-200' : mode === 'light' ? 'text-gray-500' : 'text-gray-700'}`}>
              {primaryCamera?.error ? '[ ANALYSIS ERROR ]' : '[ NO VIDEO SIGNAL ]'}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-10">
            <div className={`border rounded-lg p-3 text-right ${mode === 'light' ? 'bg-white/90 backdrop-blur-md border-blue-300 shadow-md' : 'bg-black/70 backdrop-blur-md border-blue-500/50'}`}>
              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Detected People</div>
              <div className={`text-3xl font-black ${mode === 'light' ? 'text-black' : 'text-white'}`}>{primaryMetrics?.people ?? '--'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LiveCameraFeed

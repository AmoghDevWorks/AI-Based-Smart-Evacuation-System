import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const LiveMonitoring = () => {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)
  
  const [cameras, setCameras] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [analysis, setAnalysis] = useState({ cameras: [], evacuation_plan: [] })
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    const fetchCameras = async () => {
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
          if (data.nodes) {
            // Find all nodes that have a non-empty device_id
            const activeCameras = data.nodes.filter(
              node => node.data && node.data.device_id && node.data.device_id.trim() !== ''
            ).map(node => ({
              id: node.id,
              name: node.data.label || 'Unknown Room',
              deviceId: node.data.device_id.trim()
            }))
            setCameras(activeCameras)
          }
        }
      } catch (e) {
        console.error("Failed to fetch layout cameras", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCameras()
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const fetchAnalysis = async () => {
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const res = await fetch(`${API_URL}/api/analysis/${user.id}`)
        if (!res.ok) throw new Error(`Analysis request failed (${res.status})`)
        setAnalysis(await res.json())
        setAnalysisError('')
      } catch (error) {
        setAnalysisError(error.message)
      }
    }

    fetchAnalysis()
    const intervalId = window.setInterval(fetchAnalysis, 15000)
    return () => window.clearInterval(intervalId)
  }, [user])

  return (
    <div className={`p-6 h-full flex flex-col ${mode === 'light' ? 'bg-gray-50 text-black' : 'bg-black text-white'}`}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight uppercase ${mode === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
            Live Security Feed
          </h1>
          <p className={`text-sm mt-1 uppercase tracking-widest font-bold ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
            {cameras.length} Active Streams
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
           <span className="text-xs font-bold uppercase tracking-widest text-red-500">Live</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
            <p className={`text-sm uppercase tracking-widest font-bold ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Connecting to streams...</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl border-gray-500/30">
            <div className="text-6xl mb-4 opacity-50">📹</div>
            <h3 className="text-xl font-bold mb-2">No Cameras Configured</h3>
            <p className={`max-w-md ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              There are no camera streams registered in your current building layout. Head over to the Building Layout editor, select a room, and enter a Device ID to add a camera feed here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 auto-rows-max">
            {cameras.map((cam, idx) => {
              const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
              
              // If device_id is a network URL (from an edge device), use it DIRECTLY.
              // The browser can natively render MJPEG streams via <img> without going through FastAPI.
              // Only route numeric IDs (local webcams) through the FastAPI proxy.
              const isRemoteUrl = cam.deviceId.startsWith('http://') || cam.deviceId.startsWith('https://')
              const streamUrl = isRemoteUrl
                ? cam.deviceId  // Direct connection to the edge device's Flask server
                : `${API_URL}/api/camera/stream/${user.id}/${cam.deviceId}` // Proxy local webcam through FastAPI
              const cameraAnalysis = analysis.cameras.find(item => item.node_id === cam.id)
              const metrics = cameraAnalysis?.metrics

              return (
                <div key={idx} className={`rounded-xl overflow-hidden shadow-lg border flex flex-col aspect-video relative group transition-transform duration-300 hover:shadow-2xl ${mode === 'light' ? 'bg-black border-gray-300' : 'bg-gray-900 border-gray-800'}`}>
                  
                  {/* MJPEG Stream Player */}
                  <img 
                    src={streamUrl} 
                    alt={`Stream for ${cam.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                       e.target.style.display = 'none';
                       e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback if stream fails */}
                  <div style={{display: 'none'}} className="absolute inset-0 flex-col items-center justify-center bg-gray-900 z-0">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-xs text-red-400 font-mono uppercase">Stream Disconnected</p>
                  </div>

                  {/* Overlays */}
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm drop-shadow-md">{cam.name}</span>
                      <span className="text-gray-300 text-xs font-mono drop-shadow-md mt-1">{cam.deviceId}</span>
                    </div>
                    <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse border border-red-500">Rec</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
                    <div className="rounded-lg bg-black/75 px-3 py-2 text-white text-xs backdrop-blur-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                        <span>People <strong>{metrics?.people ?? '--'}</strong></span>
                        <span>Density <strong>{metrics?.density ?? '--'}</strong></span>
                        <span>Flow <strong>{metrics?.avg_speed ?? '--'}</strong></span>
                        <span>Counter <strong>{metrics?.counter_flow ?? '--'}</strong></span>
                      </div>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${metrics?.risk_level === 'CONGESTION' ? 'bg-red-600 text-white' : metrics?.risk_level === 'WARNING' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'}`}>
                      {metrics?.risk_level || (cameraAnalysis?.connected === false ? 'Offline' : 'Analyzing')}
                    </span>
                  </div>

                  {/* AI Vision simulated overlay corners */}
                  <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/50 transition-colors pointer-events-none m-4">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/60"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/60"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/60"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/60"></div>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
      {analysisError && <p className="mt-3 text-xs text-red-500">{analysisError}</p>}
      {analysis.evacuation_plan?.length > 0 && (
        <div className={`mt-5 border-t pt-4 ${mode === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest">Evacuation Routes</h2>
            <span className="text-xs text-gray-500">Risk-weighted live recommendations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {analysis.evacuation_plan.map(plan => (
              <div key={plan.from} className={`rounded-lg border px-3 py-2 text-xs ${plan.status === 'NO_ROUTE' ? 'border-red-400/50' : mode === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                <div className="font-semibold">{plan.from_label}</div>
                {plan.status === 'NO_ROUTE' ? (
                  <div className="text-red-500 mt-1">No available exit or entry route</div>
                ) : (
                  <div className="text-green-500 mt-1">→ {plan.destination_label} · cost {plan.cost}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMonitoring

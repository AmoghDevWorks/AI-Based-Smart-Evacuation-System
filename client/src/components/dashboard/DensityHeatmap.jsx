import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const DensityHeatmap = ({ analysis }) => {
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

  const zones = (analysis?.cameras || []).map((camera) => {
    const risk = camera.metrics?.risk_level || camera.metrics?.status || 'CLEAR'
    return {
      id: camera.node_id,
      name: camera.label || camera.node_id,
      density: camera.metrics?.density ?? 0,
      status: risk === 'CONGESTION' ? 'red' : risk === 'WARNING' ? 'yellow' : 'green',
    }
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'red': return mode === 'light' ? 'bg-red-500 text-white shadow-sm border border-red-600' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
      case 'yellow': return mode === 'light' ? 'bg-yellow-400 text-black shadow-sm border border-yellow-500' : 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
      case 'green': return mode === 'light' ? 'bg-green-500 text-white shadow-sm border border-green-600' : 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
      default: return 'bg-gray-700 text-white'
    }
  }

  return (
    <div className={`border rounded-xl p-6 flex flex-col h-full transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm text-black' : 'bg-gray-900 border-gray-800 text-white'}`}>
      <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 border-b pb-2 ${mode === 'light' ? 'text-gray-500 border-gray-200' : 'text-gray-400 border-gray-800'}`}>Density Heatmap</h3>
      
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
        </div>
      ) : !hasLayout ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
           <div className="text-3xl mb-2 opacity-50">🔥</div>
           <p className={`text-sm font-semibold ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>No active layout</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {zones.length === 0 ? (
            <p className="col-span-full self-center text-center text-sm text-gray-500">Waiting for camera analysis...</p>
          ) : zones.map((zone) => (
            <div key={zone.id} className={`${getStatusColor(zone.status)} rounded-lg p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
              <div className="flex justify-between items-start">
                <span className="font-bold opacity-80">{zone.id}</span>
                <span className="text-xs font-bold uppercase bg-black/20 px-2 py-1 rounded">{zone.name}</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black">{zone.density}</div>
                <div className="text-xs uppercase tracking-wider opacity-80 mt-1 text-right w-full">Density</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DensityHeatmap

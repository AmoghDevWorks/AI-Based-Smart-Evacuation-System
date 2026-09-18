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
    const metrics = camera.metrics || {}
    const risk = metrics.over_capacity
      ? 'CONGESTION'
      : metrics.risk_level || metrics.status || 'CLEAR'
    return {
      id: camera.node_id,
      name: camera.label || camera.node_id,
      people: metrics.people ?? 0,
      capacity: metrics.capacity ?? '--',
      occupancy: metrics.occupancy_percent,
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
    <div className={`min-w-0 overflow-hidden rounded-xl border p-4 sm:p-5 lg:p-6 flex flex-col h-full transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm text-black' : 'bg-gray-900 border-gray-800 text-white'}`}>
      <h3 className={`mb-3 border-b pb-2 text-xs sm:text-sm font-bold uppercase tracking-widest ${mode === 'light' ? 'text-gray-500 border-gray-200' : 'text-gray-400 border-gray-800'}`}>Density Heatmap</h3>
      
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
        <div className="flex min-w-0 flex-1 flex-wrap content-start items-start gap-3 sm:gap-4">
          {zones.length === 0 ? (
            <p className="col-span-full self-center text-center text-sm text-gray-500">Waiting for camera analysis...</p>
          ) : zones.map((zone) => (
            <div key={zone.id} className={`${getStatusColor(zone.status)} min-w-0 w-full rounded-lg p-3 sm:w-fit sm:max-w-full sm:p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
              <div className="flex min-w-0 items-start justify-between gap-2">
                <span className="shrink-0 font-bold opacity-80">{zone.id}</span>
                <span title={zone.name} className="min-w-0 truncate rounded bg-black/20 px-2 py-1 text-right text-[10px] font-bold uppercase sm:text-xs">{zone.name}</span>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="whitespace-nowrap text-xl font-black sm:text-2xl">{zone.people} / {zone.capacity}</div>
                <div className="mt-1 w-full text-right text-[10px] uppercase tracking-wider opacity-80 sm:text-xs">
                  {zone.occupancy == null ? 'People / Capacity' : `${zone.occupancy}% occupied`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DensityHeatmap

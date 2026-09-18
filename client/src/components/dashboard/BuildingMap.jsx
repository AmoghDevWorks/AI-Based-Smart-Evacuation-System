import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const BuildingMap = ({ analysis }) => {
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
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {(analysis?.cameras || []).map((camera) => {
              const metrics = camera.metrics || {}
              const congested = metrics.over_capacity || metrics.risk_level === 'CONGESTION'
              const warning = !congested && (metrics.risk_level === 'WARNING' || metrics.status === 'WARNING')
              const color = congested ? 'border-red-400 bg-red-50 text-red-700' : warning ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-green-400 bg-green-50 text-green-700'
              return (
                <div key={camera.node_id} className={`rounded-lg border-2 p-4 ${color}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold">{camera.label || camera.node_id}</span>
                    <span className="text-xs font-bold uppercase">{congested ? 'Risk' : warning ? 'Warning' : 'Safe'}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span>People <strong>{metrics.people ?? '--'}</strong></span>
                    <span>Capacity <strong>{metrics.capacity ?? '--'}</strong></span>
                    <span className="col-span-2">Occupancy <strong>{metrics.occupancy_percent == null ? '--' : `${metrics.occupancy_percent}%`}</strong></span>
                  </div>
                </div>
              )
            })}
            {analysis?.evacuation_plan?.length > 0 && (
              <div className={`rounded-lg border p-4 sm:col-span-2 ${mode === 'light' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Evacuation routes</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.evacuation_plan.map(plan => <div key={plan.from} className="text-xs"><strong>{plan.from_label}</strong>: {plan.status === 'NO_ROUTE' ? <span className="text-red-500">No route</span> : <span className="text-green-500">{plan.destination_label}</span>}</div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuildingMap

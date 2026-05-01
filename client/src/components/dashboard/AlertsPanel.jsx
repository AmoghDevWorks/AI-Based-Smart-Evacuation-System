import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

const AlertsPanel = () => {
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
  
  const alerts = [
    { id: 1, time: '10:42:05', msg: 'High density in Corridor A', level: 'warning' },
    { id: 2, time: '10:40:12', msg: 'Bottleneck detected at Exit South', level: 'critical' },
    { id: 3, time: '10:35:00', msg: 'Camera 04 lost connection', level: 'info' },
    { id: 4, time: '10:15:33', msg: 'Density threshold exceeded (Zone 2)', level: 'warning' },
    { id: 5, time: '09:50:11', msg: 'System started successfully', level: 'info' },
  ]

  const getBadge = (level) => {
    switch (level) {
      case 'critical': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500 text-white uppercase">Critical</span>
      case 'warning': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500 text-black uppercase">Warning</span>
      case 'info': return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white uppercase">Info</span>
      default: return null
    }
  }

  return (
    <div className={`border rounded-xl flex flex-col h-full overflow-hidden transition-colors duration-300 ${mode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-900 border-gray-800'}`}>
      <div className={`p-4 border-b flex justify-between items-center ${mode === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
        <h3 className={`text-sm font-bold uppercase tracking-widest ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Recent Alerts</h3>
        <button className={`text-xs font-bold uppercase ${mode === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}>View All</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mb-2"></div>
          </div>
        ) : !hasLayout ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
             <div className="text-3xl mb-2 opacity-50">🔔</div>
             <p className={`text-sm font-semibold ${mode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>No active layout</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg transition-colors border flex flex-col gap-2 ${mode === 'light' ? 'hover:bg-gray-50 border-transparent hover:border-gray-200' : 'hover:bg-gray-800 border-transparent hover:border-gray-700'}`}>
                <div className="flex justify-between items-center">
                  {getBadge(alert.level)}
                  <span className="text-xs text-gray-500 font-mono">{alert.time}</span>
                </div>
                <p className={`text-sm font-medium ${mode === 'light' ? 'text-gray-800' : 'text-gray-200'}`}>{alert.msg}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsPanel

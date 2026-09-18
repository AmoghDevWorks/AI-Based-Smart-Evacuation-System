import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const AlertsLogs = () => {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)
  const [analysis, setAnalysis] = useState({ cameras: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return undefined
    }

    const fetchAnalysis = async () => {
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/analysis/${user.id}`)
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        setAnalysis(await response.json())
        setError('')
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
    const intervalId = window.setInterval(fetchAnalysis, 15000)
    return () => window.clearInterval(intervalId)
  }, [user])

  const logs = (analysis.cameras || []).flatMap((camera) => {
    const metrics = camera.metrics
    if (camera.connected === false || camera.error) {
      return [{ id: `${camera.node_id}-offline`, level: 'CRITICAL', event: 'Camera offline', location: camera.label, detail: camera.error || 'Connection unavailable' }]
    }
    if (!metrics) return []
    const risk = metrics.over_capacity ? 'CONGESTION' : metrics.risk_level || metrics.status || 'CLEAR'
    if (risk === 'CLEAR') return []
    return [{
      id: `${camera.node_id}-${risk}`,
      level: metrics.over_capacity ? 'CRITICAL' : risk,
      event: metrics.over_capacity ? 'Room capacity exceeded' : 'Crowd risk detected',
      location: camera.label,
      detail: `${metrics.people ?? 0} people${metrics.capacity ? ` / ${metrics.capacity} capacity` : ''}`,
    }]
  })

  return (
    <div className={`p-4 sm:p-6 min-h-full ${mode === 'light' ? 'text-black bg-gray-50' : 'text-white bg-black'}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Alerts & Logs</h1>
        <p className={`mt-1 text-sm ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Live events from camera analysis, refreshed every 15 seconds.</p>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className={`overflow-x-auto rounded-xl border ${mode === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'}`}>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading live events...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No active alerts.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className={mode === 'light' ? 'bg-gray-50 text-gray-500' : 'bg-gray-800 text-gray-400'}>
              <tr><th className="px-4 py-3 font-semibold uppercase tracking-wider">Level</th><th className="px-4 py-3 font-semibold uppercase tracking-wider">Event</th><th className="px-4 py-3 font-semibold uppercase tracking-wider">Location</th><th className="px-4 py-3 font-semibold uppercase tracking-wider">Details</th></tr>
            </thead>
            <tbody>{logs.map(log => <tr key={log.id} className="border-t border-gray-200/60 dark:border-gray-800"><td className={`px-4 py-3 font-bold ${log.level === 'CRITICAL' || log.level === 'CONGESTION' ? 'text-red-500' : 'text-yellow-600'}`}>{log.level}</td><td className="px-4 py-3">{log.event}</td><td className="px-4 py-3">{log.location}</td><td className="px-4 py-3 text-gray-500">{log.detail}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AlertsLogs

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import LiveCameraFeed from './dashboard/LiveCameraFeed'
import DensityHeatmap from './dashboard/DensityHeatmap'
import RiskIndicator from './dashboard/RiskIndicator'
import AlertsPanel from './dashboard/AlertsPanel'
import BuildingMap from './dashboard/BuildingMap'

const Hero = () => {
  const mode = useSelector((state) => state.theme.mode)
  const user = useSelector((state) => state.user.user)
  const [analysis, setAnalysis] = useState({ cameras: [], evacuation_plan: [] })

  useEffect(() => {
    if (!user) return undefined

    const fetchAnalysis = async () => {
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/analysis/${user.id}`)
        if (response.ok) setAnalysis(await response.json())
      } catch (error) {
        console.error('Failed to fetch dashboard analysis', error)
      }
    }

    fetchAnalysis()
    const intervalId = window.setInterval(fetchAnalysis, 15000)
    return () => window.clearInterval(intervalId)
  }, [user])
  
  return (
    <div className={`p-4 lg:p-6 h-full flex flex-col gap-6 min-h-[calc(100vh-73px)] overflow-x-hidden ${mode === 'light' ? 'text-black' : 'text-white'}`}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Overview</h1>
          <p className={`text-xs md:text-sm mt-1 ${mode === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>System status and real-time monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 pb-6">
        {/* Top Row: Camera (2 cols), Heatmap (1 col), Risk (1 col) */}
        <div className="lg:col-span-2 min-h-[350px] lg:h-[400px]">
          <LiveCameraFeed analysis={analysis} />
        </div>
        <div className="lg:col-span-1 min-h-[350px] lg:h-[400px]">
          <DensityHeatmap analysis={analysis} />
        </div>
        <div className="lg:col-span-1 min-h-[350px] lg:h-[400px]">
          <RiskIndicator analysis={analysis} />
        </div>

        {/* Bottom Row: Map (3 cols), Alerts (1 col) */}
        <div className="lg:col-span-3 min-h-[350px] lg:h-[400px]">
          <BuildingMap analysis={analysis} />
        </div>
        <div className="lg:col-span-1 min-h-[350px] lg:h-[400px]">
          <AlertsPanel analysis={analysis} />
        </div>
      </div>
    </div>
  )
}

export default Hero
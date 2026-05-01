import React from 'react'
import { useSelector } from 'react-redux'

const DensityHeatmap = () => {
  const mode = useSelector((state) => state.theme.mode)
  const zones = [
    { id: 'Z1', name: 'Lobby', density: 85, status: 'red' },
    { id: 'Z2', name: 'Cafeteria', density: 45, status: 'yellow' },
    { id: 'Z3', name: 'Hallway A', density: 12, status: 'green' },
    { id: 'Z4', name: 'Hallway B', density: 90, status: 'red' },
    { id: 'Z5', name: 'Exit North', density: 60, status: 'yellow' },
    { id: 'Z6', name: 'Exit South', density: 5, status: 'green' },
  ]

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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {zones.map((zone) => (
          <div key={zone.id} className={`${getStatusColor(zone.status)} rounded-lg p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
            <div className="flex justify-between items-start">
              <span className="font-bold opacity-80">{zone.id}</span>
              <span className="text-xs font-bold uppercase bg-black/20 px-2 py-1 rounded">{zone.name}</span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black">{zone.density}%</div>
              <div className="text-xs uppercase tracking-wider opacity-80 mt-1 text-right w-full">Capacity</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DensityHeatmap

import React from 'react'
import { useSelector } from 'react-redux'

const BuildingLayout = () => {
  const mode = useSelector((state) => state.theme.mode)
  return (
    <div className={`p-6 h-full ${mode === 'light' ? 'text-black' : 'text-white'}`}>
      <h1 className={`text-2xl font-bold mb-4 ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Building Layout</h1>
      <p className={mode === 'light' ? 'text-gray-600' : 'text-gray-400'}>Canvas-style editor to add rooms and connections will be displayed here.</p>
    </div>
  )
}

export default BuildingLayout

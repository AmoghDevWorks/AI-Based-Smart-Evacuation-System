import React from 'react'
import { useSelector } from 'react-redux'

const Settings = () => {
  const mode = useSelector((state) => state.theme.mode)
  return (
    <div className={`p-6 h-full ${mode === 'light' ? 'text-black' : 'text-white'}`}>
      <h1 className={`text-2xl font-bold mb-4 ${mode === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Settings</h1>
      <p className={mode === 'light' ? 'text-gray-600' : 'text-gray-400'}>Threshold configurations and alert toggles will go here.</p>
    </div>
  )
}

export default Settings

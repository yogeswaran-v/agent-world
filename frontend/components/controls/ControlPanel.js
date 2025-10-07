import React from 'react';
import AgentSelector from './AgentSelector';
import SpeedControl from './SpeedControl';

const ControlPanel = ({
  isRunning,
  numAgents,
  simulationSpeed,
  agents,
  selectedAgent,
  onAgentSelect,
  onStartStop,
  onReset,
  onSpeedChange,
  onNumAgentsChange,
  isConnected
}) => {
  return (
    <div className="glass glass-hover rounded-2xl p-6 shadow-2xl border border-white/20">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 rounded-full glass-button flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
          World Controls
        </h2>
      </div>
      
      {/* Connection Status */}
      <div className="mb-6 flex items-center justify-center">
        <div className={`glass-button px-4 py-2 rounded-full text-sm font-medium flex items-center ${
          isConnected ? 'text-green-300' : 'text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      {/* Number of Agents Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-3">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-cyan-300">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Agents: <span className="text-cyan-300 font-bold ml-1">{numAgents}</span>
          </span>
        </label>
        <div className="glass-input rounded-full p-1">
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={numAgents}
            onChange={(e) => onNumAgentsChange(parseInt(e.target.value))}
            className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider"
            disabled={isRunning}
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${numAgents}%, rgba(255,255,255,0.1) ${numAgents}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/50 mt-2">
          <span>1</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
      
      {/* Agent Selection Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-3">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-300">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Select Agent
          </span>
        </label>
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={onAgentSelect}
        />
      </div>
      
      {/* Simulation Speed Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/80 mb-3">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-green-300">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Speed: <span className="text-green-300 font-bold ml-1">{simulationSpeed}ms</span>
          </span>
        </label>
        <SpeedControl
          value={simulationSpeed}
          onChange={onSpeedChange}
        />
        <div className="flex justify-between text-xs text-white/50 mt-2">
          <span>Fast (100ms)</span>
          <span>Slow (5000ms)</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onStartStop}
          className={`glass-button flex items-center justify-center py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 ${
            isRunning
              ? 'hover:bg-amber-500/20 border-amber-400/30'
              : 'hover:bg-emerald-500/20 border-emerald-400/30'
          }`}
        >
          <span className="mr-2">
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-300">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </span>
          <span className={isRunning ? 'text-amber-300' : 'text-emerald-300'}>
            {isRunning ? 'Pause' : 'Start'}
          </span>
        </button>
        
        <button
          onClick={onReset}
          className="glass-button flex items-center justify-center py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 hover:bg-red-500/20 border-red-400/30"
        >
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-300">
              <path d="M3 2v6h6"></path>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
            </svg>
          </span>
          <span className="text-red-300">Reset</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
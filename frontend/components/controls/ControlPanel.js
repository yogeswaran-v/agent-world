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
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">World Controls</h2>
      
      {/* Connection Status */}
      <div className="mb-4 text-center">
        {isConnected ? (
          <span className="text-green-400">✓ Connected</span>
        ) : (
          <span className="text-red-400">⚠ Disconnected</span>
        )}
      </div>
      
      {/* Number of Agents Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Number of Agents: {numAgents}
        </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={numAgents}
          onChange={(e) => onNumAgentsChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          disabled={isRunning}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
      
      {/* Agent Selection Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Agent
        </label>
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={onAgentSelect}
        />
      </div>
      
      {/* Simulation Speed Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Simulation Speed (ms): {simulationSpeed}
        </label>
        <SpeedControl
          value={simulationSpeed}
          onChange={onSpeedChange}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Fast (100ms)</span>
          <span>Slow (5000ms)</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onStartStop}
          className={`flex items-center justify-center py-2 px-4 rounded-md font-medium ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          } text-white transition-colors`}
        >
          <span className="mr-2">
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </span>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={onReset}
          className="flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
        >
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"></path>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
            </svg>
          </span>
          Reset
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
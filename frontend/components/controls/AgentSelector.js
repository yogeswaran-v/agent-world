import React from 'react';

const AgentSelector = ({ agents, selectedAgent, onAgentSelect }) => {
  if (!agents || agents.length === 0) {
    return (
      <div className="glass-input rounded-xl p-3 text-center">
        <span className="text-white/50 text-sm">No agents available</span>
      </div>
    );
  }

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  return (
    <div className="relative">
      <select
        value={selectedAgent || ''}
        onChange={(e) => onAgentSelect(Number(e.target.value))}
        className="glass-input w-full p-3 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all duration-200"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '16px'
        }}
      >
        <option value="" className="bg-gray-800 text-white">Select an agent...</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id} className="bg-gray-800 text-white">
            {agent.name} - {agent.personality}
          </option>
        ))}
      </select>
      
      {selectedAgentData && (
        <div className="mt-2 p-2 glass-input rounded-lg">
          <div className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: selectedAgentData.color }}
            ></div>
            <span className="text-white/80">
              {selectedAgentData.name} • {selectedAgentData.personality}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
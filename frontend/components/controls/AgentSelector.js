import React from 'react';

const AgentSelector = ({ agents, selectedAgent, onAgentSelect }) => {
  if (!agents || agents.length === 0) {
    return (
      <select 
        className="bg-gray-700 text-gray-300 w-full p-2 rounded-md cursor-not-allowed"
        disabled
      >
        <option>No agents available</option>
      </select>
    );
  }

  return (
    <select
      value={selectedAgent || ''}
      onChange={(e) => onAgentSelect(Number(e.target.value))}
      className="bg-gray-700 text-white w-full p-2 rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      {agents.map((agent) => (
        <option key={agent.id} value={agent.id}>
          {agent.name} ({agent.personality})
        </option>
      ))}
    </select>
  );
};

export default AgentSelector;
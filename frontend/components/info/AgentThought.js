// AgentThought.js
import React from 'react';

export const AgentThought = ({ thought }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold p-4 bg-slate-700 text-white">Current Thought</h2>
      <div className="p-4 min-h-16">
        {thought ? (
          <p className="text-gray-300">{thought}</p>
        ) : (
          <p className="text-gray-400 italic">No thoughts yet</p>
        )}
      </div>
    </div>
  );
};

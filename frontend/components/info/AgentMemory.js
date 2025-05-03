// AgentMemory.js
import React from 'react';

export const AgentMemory = ({ memories }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold p-4 bg-slate-700 text-white">Agent Memory</h2>
      <div className="p-4 max-h-48 overflow-y-auto">
        {memories.length > 0 ? (
          <ul className="space-y-1 text-gray-300">
            {memories.map((memory, index) => (
              <li key={index} className="text-sm border-b border-gray-700 pb-1">
                {memory}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No memories available</p>
        )}
      </div>
    </div>
  );
};



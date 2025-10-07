// AgentMemory.js
import React from 'react';

export const AgentMemory = ({ memories }) => {
  return (
    <div className="glass glass-hover rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="glass-dark p-4 border-b border-white/10">
        <h2 className="text-lg font-bold flex items-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-cyan-300">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
          </svg>
          <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Agent Memory
          </span>
        </h2>
      </div>
      <div className="p-4 max-h-48 overflow-y-auto">
        {memories.length > 0 ? (
          <div className="space-y-2">
            {memories.map((memory, index) => (
              <div key={index} className="flex items-start glass-input rounded-lg p-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-white/80 text-sm leading-relaxed">{memory}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-white/50 italic text-sm py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6M12 17v6M4 12H1M23 12h-3M18.36 5.64l-1.42 1.42M7.05 18.95l-1.42 1.42M18.36 18.36l-1.42-1.42M7.05 5.05L5.64 6.46"/>
            </svg>
            No memories yet...
          </div>
        )}
      </div>
    </div>
  );
};



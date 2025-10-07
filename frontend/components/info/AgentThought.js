// AgentThought.js
import React from 'react';

export const AgentThought = ({ thought }) => {
  return (
    <div className="glass glass-hover rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="glass-dark p-4 border-b border-white/10">
        <h2 className="text-lg font-bold flex items-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-pink-300">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M16.24 7.76c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0z"/>
            <path d="M7.76 16.24c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0z"/>
            <path d="M16.24 16.24c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41z"/>
            <path d="M7.76 7.76c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41z"/>
          </svg>
          <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
            Current Thought
          </span>
        </h2>
      </div>
      <div className="p-4 min-h-20 flex items-center">
        {thought ? (
          <div className="flex items-start">
            <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 animate-pulse"></div>
            <p className="text-white/90 text-sm leading-relaxed">{thought}</p>
          </div>
        ) : (
          <div className="flex items-center text-white/50 italic text-sm w-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
            </svg>
            Waiting for thoughts...
          </div>
        )}
      </div>
    </div>
  );
};

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

// Conversations.js
import React from 'react';

export const Conversations = ({ conversations }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 bg-slate-700">
        <h2 className="text-xl font-bold text-white">Agent Conversations</h2>
        <button 
          className="p-2 rounded-full bg-slate-600 hover:bg-slate-500 text-white transition-colors"
          title="Refresh conversations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation, index) => {
              // Split by newlines to maintain formatting
              const lines = conversation.split('\n');
              
              return (
                <div key={index} className="pb-4 border-b border-gray-700">
                  {lines.map((line, lineIndex) => {
                    // Format timestamp differently if present
                    if (lineIndex === 0 && line.includes('[') && line.includes(']')) {
                      const timeEnd = line.indexOf(']') + 1;
                      const timestamp = line.substring(0, timeEnd);
                      const content = line.substring(timeEnd);
                      
                      return (
                        <p key={lineIndex} className="text-sm">
                          <span className="text-gray-500">{timestamp}</span>
                          <span className="text-gray-300">{content}</span>
                        </p>
                      );
                    }
                    
                    // Detect speaker for different styling
                    if (line.includes(':')) {
                      const [speaker, dialogue] = line.split(':', 2);
                      
                      return (
                        <p key={lineIndex} className="text-sm mt-1">
                          <span className="text-blue-400 font-medium">{speaker}:</span>
                          <span className="text-gray-300">{dialogue}</span>
                        </p>
                      );
                    }
                    
                    return <p key={lineIndex} className="text-sm text-gray-300 mt-1">{line}</p>;
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 italic">No conversations yet</p>
        )}
      </div>
    </div>
  );
};

export default {
  AgentMemory,
  AgentThought,
  Conversations
};
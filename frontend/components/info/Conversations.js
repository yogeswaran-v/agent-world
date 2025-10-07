import React, { useEffect, useState } from 'react';

export const Conversations = ({ conversations: initialConversations = [] }) => {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    // Function to handle WebSocket message events
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'conversation_update') {
          console.log("Conversation update received:", data.data);
          setConversations(data.data);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    // Add the listener if window.socket exists
    if (window.socket) {
      console.log("Adding conversation listener to WebSocket");
      window.socket.addEventListener('message', handleWebSocketMessage);
      
      // Request the latest conversations
      if (window.socket.readyState === WebSocket.OPEN) {
        console.log("Requesting conversations");
        window.socket.send(JSON.stringify({
          command: "get_conversations"
        }));
      }
    } else {
      console.warn("WebSocket not available for conversations");
    }
    
    // Cleanup function to remove the listener
    return () => {
      if (window.socket) {
        window.socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, []);

  // Enhanced rendering with better styling and formatting
  return (
    <div className="glass glass-hover rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      <div className="glass-dark p-4 border-b border-white/10">
        <h2 className="text-lg font-bold flex items-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-green-300">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
            Conversations
          </span>
          {conversations && conversations.length > 0 && (
            <span className="ml-2 glass-button px-2 py-1 rounded-full text-xs text-green-300">
              {conversations.length}
            </span>
          )}
        </h2>
      </div>
      <div className="p-4 max-h-72 overflow-y-auto">
        {conversations && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv, index) => (
              <div key={index} className="glass-input rounded-xl p-4 border border-white/10">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full glass-button flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="whitespace-pre-line text-sm text-white/90 leading-relaxed font-light">
                      {conv}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-white/50 italic text-sm py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M8 10h8"/>
              <path d="M8 14h6"/>
            </svg>
            <div className="text-center">
              <p>No conversations yet</p>
              <p className="text-xs text-white/30 mt-1">Agents will start chatting soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
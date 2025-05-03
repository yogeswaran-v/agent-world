// frontend/components/info/Conversations.js
import React, { useEffect, useState } from 'react';

export const Conversations = ({ conversations: initialConversations = [] }) => {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    // Function to handle WebSocket message events
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'conversation_update') {
          console.log("Conversation update received:", data.data.length, "conversations");
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

  // Render the conversations
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold p-4 bg-slate-700 text-white">Conversations</h2>
      <div className="p-4 max-h-48 overflow-y-auto">
        {conversations && conversations.length > 0 ? (
          <ul className="space-y-2 text-gray-300">
            {conversations.map((conv, index) => (
              <li key={index} className="border-b border-gray-700 pb-2">
                <pre className="whitespace-pre-line text-sm font-mono">{conv}</pre>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No conversations yet</p>
        )}
      </div>
    </div>
  );
};

export default Conversations;
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connections
 * @param {string} url - WebSocket URL to connect to
 * @returns {Object} WebSocket connection state and methods
 */
const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);

  // Create WebSocket connection
  useEffect(() => {
    // Clean up function to be called on component unmount or URL change
    const cleanup = () => {
      if (socket) {
        socket.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
    
    // Don't connect if no URL is provided
    if (!url) {
      cleanup();
      return cleanup;
    }
    
    // Create a new WebSocket connection
    const newSocket = new WebSocket(url);
    
    // Set up event handlers
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send any queued messages
      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift();
        newSocket.send(message);
      }
    };
    
    newSocket.onclose = (event) => {
      console.log('WebSocket disconnected', event);
      setIsConnected(false);
      
      // Set up reconnection
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        cleanup();
        // This will trigger the effect again
        setSocket(null);
      }, 3000);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onmessage = (event) => {
      setLastMessage(event.data);
    };
    
    // Store the socket in state
    setSocket(newSocket);
    
    // Clean up on unmount
    return cleanup;
  }, [url, socket]);
  
  // Function to send messages safely
  const sendMessage = useCallback((message) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      // Queue the message to send when connection is established
      messageQueueRef.current.push(message);
    }
  }, [socket]);
  
  // Set up a ping to keep the connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      sendMessage(JSON.stringify({
        command: 'ping',
        time: Date.now()
      }));
    }, 30000); // Send ping every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);
  
  return { socket, isConnected, lastMessage, sendMessage };
};

export default useWebSocket;
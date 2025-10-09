import { useState, useCallback } from 'react';

/**
 * Custom hook for managing simulation controls
 * @param {number} defaultNumAgents - Default number of agents
 * @param {number} defaultSpeed - Default simulation speed
 * @param {Function} sendMessage - Function to send WebSocket messages
 * @param {boolean} isConnected - Whether WebSocket is connected
 * @returns {Object} Simulation control state and handlers
 */
const useSimulation = (defaultNumAgents, defaultSpeed, sendMessage, isConnected = false) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(defaultSpeed);
  const [numAgents, setNumAgents] = useState(defaultNumAgents);
  
  // Helper function to send command via HTTP API fallback
  const sendHTTPCommand = useCallback(async (command, data = {}) => {
    try {
      const apiUrl = '/api/simulation';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, ...data }),
      });
      
      if (!response.ok) {
        console.error('HTTP command failed:', response.status);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('HTTP command error:', error);
      return false;
    }
  }, []);
  
  // Start the simulation
  const startSimulation = useCallback(async () => {
    if (isConnected) {
      sendMessage(JSON.stringify({ command: 'start_simulation' }));
    } else {
      console.log('WebSocket not connected, using HTTP API for start simulation');
      const success = await sendHTTPCommand('start_simulation');
      if (!success) return;
    }
    setIsRunning(true);
  }, [sendMessage, isConnected, sendHTTPCommand]);
  
  // Stop the simulation
  const stopSimulation = useCallback(async () => {
    if (isConnected) {
      sendMessage(JSON.stringify({ command: 'stop_simulation' }));
    } else {
      console.log('WebSocket not connected, using HTTP API for stop simulation');
      const success = await sendHTTPCommand('stop_simulation');
      if (!success) return;
    }
    setIsRunning(false);
  }, [sendMessage, isConnected, sendHTTPCommand]);
  
  // Reset the simulation
  const resetSimulation = useCallback(async () => {
    if (isConnected) {
      sendMessage(JSON.stringify({ 
        command: 'reset_simulation',
        num_agents: numAgents
      }));
    } else {
      console.log('WebSocket not connected, using HTTP API for reset simulation');
      const success = await sendHTTPCommand('reset_simulation', { num_agents: numAgents });
      if (!success) return;
    }
    setIsRunning(false);
  }, [sendMessage, numAgents, isConnected, sendHTTPCommand]);
  
  // Update simulation speed
  const handleSpeedChange = useCallback(async (speed) => {
    if (isConnected) {
      sendMessage(JSON.stringify({ 
        command: 'update_speed',
        speed
      }));
    } else {
      console.log('WebSocket not connected, using HTTP API for speed change');
      await sendHTTPCommand('update_speed', { speed });
    }
    setSimulationSpeed(speed);
  }, [sendMessage, isConnected, sendHTTPCommand]);
  
  // Update number of agents
  const handleNumAgentsChange = useCallback((count) => {
    // Don't send message immediately - wait for reset
    setNumAgents(count);
  }, []);
  
  return {
    isRunning,
    simulationSpeed,
    numAgents,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationSpeed: handleSpeedChange,
    setNumAgents: handleNumAgentsChange,
  };
};

export default useSimulation;
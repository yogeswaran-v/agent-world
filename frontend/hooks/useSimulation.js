import { useState, useCallback } from 'react';

/**
 * Custom hook for managing simulation controls
 * @param {number} defaultNumAgents - Default number of agents
 * @param {number} defaultSpeed - Default simulation speed
 * @param {Function} sendMessage - Function to send WebSocket messages
 * @returns {Object} Simulation control state and handlers
 */
const useSimulation = (defaultNumAgents, defaultSpeed, sendMessage) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(defaultSpeed);
  const [numAgents, setNumAgents] = useState(defaultNumAgents);
  
  // Start the simulation
  const startSimulation = useCallback(() => {
    sendMessage(JSON.stringify({ command: 'start_simulation' }));
    setIsRunning(true);
  }, [sendMessage]);
  
  // Stop the simulation
  const stopSimulation = useCallback(() => {
    sendMessage(JSON.stringify({ command: 'stop_simulation' }));
    setIsRunning(false);
  }, [sendMessage]);
  
  // Reset the simulation
  const resetSimulation = useCallback(() => {
    sendMessage(JSON.stringify({ 
      command: 'reset_simulation',
      num_agents: numAgents
    }));
    setIsRunning(false);
  }, [sendMessage, numAgents]);
  
  // Update simulation speed
  const handleSpeedChange = useCallback((speed) => {
    sendMessage(JSON.stringify({ 
      command: 'update_speed',
      speed
    }));
    setSimulationSpeed(speed);
  }, [sendMessage]);
  
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
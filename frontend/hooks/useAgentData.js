import { useState, useCallback } from 'react';

/**
 * Custom hook for managing agent data
 * @returns {Object} Agent data state and handlers
 */
const useAgentData = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  
  // Handle agent data updates from the server
  const handleAgentUpdate = useCallback((agentData) => {
    setAgents(agentData);
    
    // If no agent is selected yet, select the first one
    if (!selectedAgent && agentData.length > 0) {
      setSelectedAgent(agentData[0].id);
    }
    
    // If selected agent no longer exists, select the first one
    if (selectedAgent && !agentData.some(agent => agent.id === selectedAgent)) {
      setSelectedAgent(agentData.length > 0 ? agentData[0].id : null);
    }
  }, [selectedAgent]);
  
  // Handle conversation updates from the server
  const handleConversationUpdate = useCallback((conversationData) => {
    setConversations(conversationData);
  }, []);
  
  return {
    agents,
    selectedAgent,
    setSelectedAgent,
    handleAgentUpdate,
    conversations,
    handleConversationUpdate
  };
};

export default useAgentData;
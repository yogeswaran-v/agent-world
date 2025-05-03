import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import WorldCanvas from '../components/world/WorldCanvas';
import ControlPanel from '../components/controls/ControlPanel';
import {AgentMemory} from '../components/info/AgentMemory';
import {AgentThought} from '../components/info/AgentThought';
import {Conversations} from '../components/info/Conversations';
import useWebSocket from '../hooks/useWebSocket';
import useAgentData from '../hooks/useAgentData';
import useSimulation from '../hooks/useSimulation';
import { DEFAULT_NUM_AGENTS, DEFAULT_SIMULATION_SPEED } from '../lib/constants';

export default function Home() {
  // Get WebSocket connection
  const { 
    socket, 
    isConnected, 
    lastMessage, 
    sendMessage 
  } = useWebSocket('ws://localhost:8000/ws');

  // Agent data management
  const { 
    agents, 
    selectedAgent, 
    setSelectedAgent, 
    handleAgentUpdate, 
    conversations,
    handleConversationUpdate
  } = useAgentData();

  // Simulation controls
  const {
    isRunning,
    simulationSpeed,
    numAgents,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationSpeed,
    setNumAgents
  } = useSimulation(DEFAULT_NUM_AGENTS, DEFAULT_SIMULATION_SPEED, sendMessage);

  // Process WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'agent_update') {
          handleAgentUpdate(data.data);
        } else if (data.type === 'conversation_update') {
          console.log('Conversation update received:', data.data);
          handleConversationUpdate(data.data);
        } else if (data.status === 'simulation_started') {
          console.log('Simulation started');
        } else if (data.status === 'simulation_stopped') {
          console.log('Simulation stopped');
        } else if (data.status === 'simulation_reset') {
          console.log('Simulation reset');
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  }, [lastMessage, handleAgentUpdate, handleConversationUpdate]);

  // Initial data fetch when connection is established
  useEffect(() => {
    if (isConnected) {
      console.log('WebSocket connected, requesting initial data');
      // Request initial data
      sendMessage(JSON.stringify({ command: 'get_agents' }));
      sendMessage(JSON.stringify({ command: 'get_conversations' }));
    }
  }, [isConnected, sendMessage]);

  // Share socket globally for other components to access
  useEffect(() => {
    if (socket) {
      window.socket = socket;
    }
    return () => {
      // Clean up global reference when component unmounts
      if (window.socket === socket) {
        window.socket = null;
      }
    };
  }, [socket]);

  // Request conversations periodically to ensure we get updates
  useEffect(() => {
    if (!isConnected) return;
    
    const intervalId = setInterval(() => {
      if (isRunning) {
        sendMessage(JSON.stringify({ command: 'get_conversations' }));
      }
    }, 5000); // Check every 5 seconds while simulation is running
    
    return () => clearInterval(intervalId);
  }, [isConnected, isRunning, sendMessage]);

  return (
    <>
      <Head>
        <title>Agent's World</title>
        <meta name="description" content="A 3D world for GenAI agents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {/* Left panel: Controls and agent info */}
          <div className="md:col-span-1">
            <ControlPanel
              isRunning={isRunning}
              numAgents={numAgents}
              simulationSpeed={simulationSpeed}
              agents={agents}
              selectedAgent={selectedAgent}
              onAgentSelect={setSelectedAgent}
              onStartStop={isRunning ? stopSimulation : startSimulation}
              onReset={resetSimulation}
              onSpeedChange={setSimulationSpeed}
              onNumAgentsChange={setNumAgents}
              isConnected={isConnected}
            />
            
            <div className="mt-4">
              <AgentMemory 
                memories={selectedAgent ? agents.find(a => a.id === selectedAgent)?.memory || [] : []} 
              />
            </div>
            
            <div className="mt-4">
              <AgentThought 
                thought={selectedAgent ? agents.find(a => a.id === selectedAgent)?.last_thought || '' : ''} 
              />
            </div>
          </div>
          
          {/* Right panel: World visualization and conversations */}
          <div className="md:col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
              <h2 className="text-xl font-bold p-4 bg-slate-700 text-white">3D World</h2>
              <div className="h-[550px] w-full">
                <WorldCanvas 
                  agents={agents} 
                  selectedAgent={selectedAgent}
                  onAgentClick={setSelectedAgent}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Conversations conversations={conversations} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
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
  // Dynamically select ws or wss and host based on environment
  let wsProtocol = 'ws';
  let wsHost = 'backend:8000';
  if (typeof window !== 'undefined') {
    // Handle GitHub Codespaces environment
    if (window.location.hostname.includes('github.dev')) {
      // In Codespaces, use the same hostname but different port
      wsProtocol = 'wss'; // Codespaces uses HTTPS, so we need WSS
      // Use the current hostname but change port from 3000 to 8000
      const currentHost = window.location.hostname;
      const backendHost = currentHost.replace('-3000.', '-8000.');
      wsHost = backendHost;
    } else {
      // For local development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        wsProtocol = 'ws'; // Force ws for localhost development
        wsHost = 'localhost:8000';
      } else {
        // For other production environments
        wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        wsHost = 'backend:8000';
      }
    }
  }
  const wsUrl = `${wsProtocol}://${wsHost}/ws`;
  console.log('WebSocket URL:', wsUrl, 'Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  const { 
    socket, 
    isConnected, 
    lastMessage, 
    sendMessage 
  } = useWebSocket(wsUrl);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Controls and agent info */}
          <div className="lg:col-span-1 space-y-6">
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
            
            <AgentMemory 
              memories={selectedAgent ? agents.find(a => a.id === selectedAgent)?.memory || [] : []} 
            />
            
            <AgentThought 
              thought={selectedAgent ? agents.find(a => a.id === selectedAgent)?.last_thought || '' : ''} 
            />
          </div>
          
          {/* Right panel: World visualization and conversations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass glass-hover rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <div className="glass-dark p-4 border-b border-white/10">
                <h2 className="text-xl font-bold flex items-center text-white">
                  <div className="w-8 h-8 rounded-full glass-button flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    3D World Simulation
                  </span>
                </h2>
              </div>
              <div className="h-[550px] w-full relative">
                <WorldCanvas 
                  agents={agents} 
                  selectedAgent={selectedAgent}
                  onAgentClick={setSelectedAgent}
                />
                {/* Overlay for better glass effect */}
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-b-2xl"></div>
              </div>
            </div>
            
            <Conversations conversations={conversations} />
          </div>
        </div>
      </Layout>
    </>
  );
}
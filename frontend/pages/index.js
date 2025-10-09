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
  // Get WebSocket connection - only on client side
  const [wsUrl, setWsUrl] = useState(null);
  
  useEffect(() => {
    console.log('useEffect for WebSocket URL triggered, window available:', typeof window !== 'undefined');
    if (typeof window !== 'undefined') {
      let wsProtocol = 'ws';
      let wsHost = 'localhost:8000'; // Default for local development
      
      console.log('Window location details:', {
        hostname: window.location.hostname,
        href: window.location.href,
        protocol: window.location.protocol
      });
      
      // Handle GitHub Codespaces environment
      if (window.location.hostname.includes('github.dev')) {
        // In Codespaces, use the same hostname but different port
        wsProtocol = 'wss'; // Codespaces uses HTTPS, so we need WSS
        // Use the current hostname but change port from 3000 to 8000
        const currentHost = window.location.hostname;
        const backendHost = currentHost.replace('-3000.', '-8000.');
        wsHost = backendHost;
        console.log('Detected Codespaces environment, using WSS:', backendHost);
      } else {
        // For local development
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalhost) {
          wsProtocol = 'ws'; // Force ws for localhost development
          wsHost = 'localhost:8000';
          console.log('Detected localhost environment, using WS:', wsHost);
        } else {
          // For other production environments
          wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
          wsHost = 'backend:8000';
          console.log('Detected production environment, using:', wsProtocol, wsHost);
        }
      }
      
      const url = `${wsProtocol}://${wsHost}/ws`;
      console.log('Final WebSocket URL set to:', url);
      setWsUrl(url);
    } else {
      console.log('Window not available, cannot set WebSocket URL');
    }
  }, []);
  console.log('About to call useWebSocket with URL:', wsUrl);
  const { 
    socket, 
    isConnected, 
    lastMessage, 
    sendMessage 
  } = useWebSocket(wsUrl);
  console.log('useWebSocket returned - isConnected:', isConnected, 'socket:', !!socket);

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
  } = useSimulation(DEFAULT_NUM_AGENTS, DEFAULT_SIMULATION_SPEED, sendMessage, isConnected);

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
      // Request initial data via WebSocket
      sendMessage(JSON.stringify({ command: 'get_agents' }));
      sendMessage(JSON.stringify({ command: 'get_conversations' }));
    }
  }, [isConnected, sendMessage]);

  // Fallback: Fetch initial agent data via HTTP API if WebSocket is not connected
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let apiUrl;
        if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
          // In Codespaces, use the Next.js API proxy to avoid CORS issues
          apiUrl = '/api/agents';
        } else {
          // For local development, connect directly to backend
          apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/agents/`;
        }
        
        console.log('Fetching initial agent data via HTTP API from:', apiUrl);
        const response = await fetch(apiUrl);
        if (response.ok) {
          const agentData = await response.json();
          console.log('Loaded', agentData.length, 'agents via HTTP API');
          handleAgentUpdate(agentData);
        } else {
          console.error('Failed to fetch agents:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching initial agent data:', error);
      }
    };

    // Fetch data immediately, and also retry if WebSocket fails to connect
    fetchInitialData();
    
    // If WebSocket is not connected after 3 seconds, fetch via HTTP as fallback
    const fallbackTimer = setTimeout(() => {
      if (!isConnected) {
        console.log('WebSocket not connected, using HTTP fallback for agent data');
        fetchInitialData();
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [handleAgentUpdate]); // Only run once on component mount

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    if (isConnected) return; // Don't poll if WebSocket is working
    
    const pollForUpdates = async () => {
      try {
        let apiUrl;
        if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
          apiUrl = '/api/agents';
        } else {
          apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/agents/`;
        }
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const agentData = await response.json();
          handleAgentUpdate(agentData);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Start polling when running simulation and WebSocket is disconnected
    let intervalId;
    if (isRunning) {
      console.log('Starting polling fallback for agent updates');
      pollForUpdates(); // Initial poll
      intervalId = setInterval(pollForUpdates, 1000); // Poll every second during simulation
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, isRunning, handleAgentUpdate]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left panel: Controls and agent info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Debug Info */}
            <div className="bg-yellow-100 border border-yellow-300 p-2 rounded text-xs">
              <div><strong>WebSocket Debug:</strong></div>
              <div>URL: {wsUrl || 'null'}</div>
              <div>Connected: {isConnected ? '✅ Yes' : '❌ No'}</div>
              <div>Socket: {socket ? '✓ Exists' : '✗ None'}</div>
              <div>Last Message: {lastMessage ? 'Yes' : 'No'}</div>
              <div><strong>Agent Data:</strong></div>
              <div>Agents Loaded: {agents.length} {agents.length > 0 ? '✅' : '❌'}</div>
              <div>Selected: {selectedAgent !== null ? `Agent ${selectedAgent}` : 'None'}</div>
              {agents.length > 0 && (
                <div>First Agent: {agents[0]?.name} at ({agents[0]?.x}, {agents[0]?.y})</div>
              )}
              <button 
                onClick={async () => {
                  try {
                    let apiUrl;
                    if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
                      // In Codespaces, use the Next.js API proxy
                      apiUrl = '/api/agents';
                    } else {
                      // For local development
                      apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/agents/`;
                    }
                    
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    alert(`Manual fetch from ${apiUrl}: ${data.length} agents loaded`);
                  } catch (e) {
                    alert('Manual fetch failed: ' + e.message);
                  }
                }}
                className="mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded"
              >
                Test API
              </button>
            </div>
            
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
          <div className="lg:col-span-2 space-y-4">
            <div className="glass glass-hover rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <div className="glass-dark p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center text-white">
                    <div className="w-6 h-6 rounded-full glass-button flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                      2.5D World Simulation
                    </span>
                  </h2>
                  <button 
                    className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Expand View"
                    onClick={() => {
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          canvas.parentElement.requestFullscreen();
                        }
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="h-[75vh] w-full relative">
                <WorldCanvas 
                  agents={agents} 
                  selectedAgent={selectedAgent}
                  onAgentClick={setSelectedAgent}
                />
                {/* Overlay for better glass effect */}
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-b-2xl"></div>
              </div>
            </div>
            
            <div className="max-h-48 overflow-hidden">
              <Conversations conversations={conversations} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
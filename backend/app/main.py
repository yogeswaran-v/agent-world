from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import logging
import json
import os
from typing import List, Dict, Any

from app.routers import agents
from app.core.config import settings
from app.core.logger import setup_logging
from app.services.agent_service import AgentService
from app.services.conversation_service import ConversationService
from app.services.thinking_service import ThinkingService

# Setup logging
logger = setup_logging()

# Setup detailed logging for WebSockets
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Set more detailed logging for specific modules
logging.getLogger("app.routers.websockets").setLevel(logging.DEBUG)
logging.getLogger("app.services.conversation_service").setLevel(logging.DEBUG)
logging.getLogger("app.services.agent_service").setLevel(logging.DEBUG)


# Shared state for WebSocket clients
connected_clients: List[WebSocket] = []

# Initialize services at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize services
    logger.info("Initializing services...")
    agent_service = AgentService()
    conversation_service = ConversationService()
    thinking_service = ThinkingService()
    
    # Store services in app state
    app.state.agent_service = agent_service
    app.state.conversation_service = conversation_service
    app.state.thinking_service = thinking_service
    
    # Start background tasks
    simulation_task = asyncio.create_task(run_simulation(app))
    
    # Provide app to caller
    yield
    
    # Cleanup
    logger.info("Shutting down services...")
    simulation_task.cancel()
    try:
        await simulation_task
    except asyncio.CancelledError:
        logger.info("Simulation task cancelled")

# Create FastAPI app
app = FastAPI(
    title="Agent World API",
    description="Backend API for Agent World simulation",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        f"https://{os.getenv('CODESPACE_NAME', 'localhost')}-3000.app.github.dev",  # GitHub Codespaces frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api")

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"WebSocket client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Send initial data to the client
        agents_data = app.state.agent_service.get_agents_data()
        await websocket.send_json({
            "type": "agent_update",
            "data": agents_data
        })
        
        conversations = app.state.conversation_service.get_conversations()
        await websocket.send_json({
            "type": "conversation_update",
            "data": conversations
        })
        
        # Keep connection alive and handle client messages
        while True:
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {data}")
            await process_client_message(websocket, data, app)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        logger.info(f"WebSocket client removed. Total clients: {len(connected_clients)}")

async def process_client_message(websocket: WebSocket, data: str, app: FastAPI):
    """Process messages from WebSocket clients."""
    try:
        # Parse message and handle commands
        message = json.loads(data)
        command = message.get("command")
        logger.debug(f"Processing client command: {command}")
        
        if command == "ping":
            await websocket.send_json({"type": "pong", "time": message.get("time", 0)})
            return
            
        if command == "start_simulation":
            app.state.simulation_running = True
            await websocket.send_json({"status": "simulation_started"})
            
        elif command == "stop_simulation":
            app.state.simulation_running = False
            await websocket.send_json({"status": "simulation_stopped"})
            
        elif command == "reset_simulation":
            app.state.agent_service.reset_agents(message.get("num_agents", settings.NUM_AGENTS))
            await broadcast_agent_update(app)
            await websocket.send_json({"status": "simulation_reset"})
            
        elif command == "update_speed":
            app.state.simulation_speed = message.get("speed", settings.MOVE_INTERVAL)
            await websocket.send_json({"status": "speed_updated"})
            
        elif command == "get_agents":
            agents_data = app.state.agent_service.get_agents_data()
            await websocket.send_json({
                "type": "agent_update", 
                "data": agents_data
            })
            
        elif command == "get_conversations":
            conversations = app.state.conversation_service.get_conversations()
            logger.debug(f"Sending conversations: {len(conversations)} items")
            await websocket.send_json({
                "type": "conversation_update", 
                "data": conversations
            })
            
        else:
            logger.warning(f"Unknown command: {command}")
            await websocket.send_json({"error": f"Unknown command: {command}"})
            
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON received: {data}")
        await websocket.send_json({"error": "Invalid JSON format"})
    except Exception as e:
        logger.error(f"Error processing client message: {e}")
        await websocket.send_json({"status": "error", "message": str(e)})

async def broadcast_agent_update(app: FastAPI):
    """Broadcast agent updates to all connected clients."""
    if not connected_clients:
        return
    
    # Get agent data
    agents_data = app.state.agent_service.get_agents_data()
    
    # Send updates to all clients
    message = {
        "type": "agent_update",
        "data": agents_data
    }
    
    disconnected_clients = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to WebSocket client: {e}")
            disconnected_clients.append(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)

# In backend/app/main.py, replace the broadcast_conversation_update function with this enhanced version:

async def broadcast_conversation_update(app: FastAPI):
    """Broadcast conversation updates to all connected clients."""
    if not connected_clients:
        logger.debug("No connected clients to broadcast conversations to")
        return
    
    # Get conversation data
    conversations = app.state.conversation_service.get_conversations()
    
    # Only broadcast if there are conversations to send
    if not conversations:
        logger.debug("No conversations to broadcast")
        return
        
    logger.info(f"Broadcasting {len(conversations)} conversations to {len(connected_clients)} client(s)")
    
    # Send updates to all clients
    message = {
        "type": "conversation_update",
        "data": conversations
    }
    
    disconnected_clients = []
    for client in connected_clients:
        try:
            await client.send_json(message)
            logger.debug(f"Sent conversation update to client")
        except Exception as e:
            logger.error(f"Error sending to WebSocket client: {e}")
            disconnected_clients.append(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)
            logger.info(f"Removed disconnected client. Remaining clients: {len(connected_clients)}")

# Also make sure the run_simulation function properly broadcasts conversations after processing:

    async def run_simulation(app: FastAPI):
        """Run the simulation loop in the background."""
        app.state.simulation_running = False
        app.state.simulation_speed = settings.MOVE_INTERVAL
        
        while True:
            try:
                if app.state.simulation_running:
                    # Update agent positions
                    app.state.agent_service.update_agents()
                    
                    # Process agent conversations
                    conversations = app.state.agent_service.get_conversation_queue()
                    if conversations:
                        logger.info(f"Processing {len(conversations)} conversations")
                        app.state.conversation_service.add_pending_conversations(conversations)
                        
                        # Process conversations using available method (async or sync)
                        try:
                            await app.state.conversation_service.process_conversation_batch_async()
                        except Exception as e:
                            logger.error(f"Error in async conversation processing: {e}")
                            app.state.conversation_service.process_conversation_batch()
                        
                        # Explicitly broadcast conversations after processing
                        await broadcast_conversation_update(app)
                    
                    # Generate thoughts for agents that need them
                    thinking_agents = app.state.agent_service.get_agent_for_thinking()
                    if thinking_agents:
                        app.state.thinking_service.add_pending_agents(thinking_agents)
                        # Process thinking using available method (async or sync)
                        try:
                            await app.state.thinking_service.process_thinking_batch_async()
                        except Exception as e:
                            logger.error(f"Error in async thinking: {e}")
                            app.state.thinking_service.process_thinking_batch()
                    
                    # Broadcast agent updates
                    await broadcast_agent_update(app)
                
                # Sleep based on simulation speed
                await asyncio.sleep(app.state.simulation_speed / 1000)  # Convert ms to seconds
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                await asyncio.sleep(1)  # Sleep on error to prevent CPU spinning



async def run_simulation(app: FastAPI):
    """Run the simulation loop in the background."""
    app.state.simulation_running = False
    app.state.simulation_speed = settings.MOVE_INTERVAL
    
    while True:
        try:
            if app.state.simulation_running:
                # Update agent positions
                app.state.agent_service.update_agents()
                
                # Process agent conversations
                conversations = app.state.agent_service.get_conversation_queue()
                if conversations:
                    logger.info(f"Processing {len(conversations)} conversations")
                    app.state.conversation_service.add_pending_conversations(conversations)
                    # Process conversations using available method (async or sync)
                    try:
                        await app.state.conversation_service.process_conversation_batch_async()
                    except Exception as e:
                        logger.error(f"Error in async conversation processing: {e}")
                        app.state.conversation_service.process_conversation_batch()
                    
                    # Explicitly broadcast conversations after processing
                    await broadcast_conversation_update(app)
                
                # Generate thoughts for agents that need them
                thinking_agents = app.state.agent_service.get_agent_for_thinking()
                if thinking_agents:
                    app.state.thinking_service.add_pending_agents(thinking_agents)
                    # Process thinking using available method (async or sync)
                    try:
                        await app.state.thinking_service.process_thinking_batch_async()
                    except Exception as e:
                        logger.error(f"Error in async thinking: {e}")
                        app.state.thinking_service.process_thinking_batch()
                
                # Broadcast agent updates
                await broadcast_agent_update(app)
            
            # Sleep based on simulation speed
            await asyncio.sleep(app.state.simulation_speed / 1000)  # Convert ms to seconds
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            await asyncio.sleep(1)  # Sleep on error to prevent CPU spinning

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
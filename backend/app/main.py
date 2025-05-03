from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import logging
from typing import List, Dict, Any

from app.routers import agents
from app.core.config import settings
from app.core.logger import setup_logging
from app.services.agent_service import AgentService
from app.services.conversation_service import ConversationService
from app.services.thinking_service import ThinkingService

# Setup logging
logger = setup_logging()

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # Process other client messages
                await process_client_message(websocket, data, app)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    finally:
        connected_clients.remove(websocket)

async def process_client_message(websocket: WebSocket, data: str, app: FastAPI):
    """Process messages from WebSocket clients."""
    try:
        # Parse message and handle commands
        import json
        message = json.loads(data)
        command = message.get("command")
        
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
    
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to WebSocket client: {e}")

async def broadcast_conversation_update(app: FastAPI):
    """Broadcast conversation updates to all connected clients."""
    if not connected_clients:
        return
    
    # Get conversation data
    conversations = app.state.conversation_service.get_conversations()
    
    # Send updates to all clients
    message = {
        "type": "conversation_update",
        "data": conversations
    }
    
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to WebSocket client: {e}")

async def run_simulation(app: FastAPI):
    """Run the simulation loop in the background."""
    app.state.simulation_running = False
    app.state.simulation_speed = settings.MOVE_INTERVAL
    
    while True:
        try:
            if app.state.simulation_running:
                # Update agent positions
                app.state.agent_service.update_agents()
                
                # Generate thoughts for agents that need them
                app.state.thinking_service.process_thinking_batch()
                
                # Process conversations
                app.state.conversation_service.process_conversation_batch()
                
                # Broadcast updates
                await broadcast_agent_update(app)
                await broadcast_conversation_update(app)
            
            # Sleep based on simulation speed
            await asyncio.sleep(app.state.simulation_speed / 1000)  # Convert ms to seconds
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}")
            await asyncio.sleep(1)  # Sleep on error to prevent CPU spinning

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
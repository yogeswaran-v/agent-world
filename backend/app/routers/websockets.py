from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from typing import List, Dict, Any
import logging
import json
import asyncio

router = APIRouter(prefix="/ws", tags=["websocket"])
logger = logging.getLogger(__name__)

# Global list of connected clients
connected_clients: List[WebSocket] = []

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket, request: Request):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    connected_clients.append(websocket)
    
    logger.debug(f"WebSocket client connected. Total clients: {len(connected_clients)}")
    
    # Start the conversation broadcast task if it's not already running
    if not hasattr(request.app.state, "conversation_broadcast_task"):
        logger.info("Starting conversation broadcast task")
        request.app.state.conversation_broadcast_task = asyncio.create_task(
            ensure_conversation_broadcast(request.app)
        )
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Handle incoming messages
            try:
                logger.debug(f"Received message: {data}")
                message = json.loads(data)
                await handle_client_message(websocket, message, request.app)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
                await websocket.send_json({"error": "Invalid JSON"})
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                await websocket.send_json({"error": str(e)})
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    finally:
        connected_clients.remove(websocket)
        logger.debug(f"WebSocket client removed. Total clients: {len(connected_clients)}")
        
async def handle_client_message(websocket: WebSocket, message: Dict[str, Any], app):
    """Handle incoming WebSocket messages."""
    command = message.get("command")
    
    if command == "start_simulation":
        app.state.simulation_running = True
        await websocket.send_json({"status": "simulation_started"})
    
    elif command == "stop_simulation":
        app.state.simulation_running = False
        await websocket.send_json({"status": "simulation_stopped"})
    
    elif command == "reset_simulation":
        num_agents = message.get("num_agents", app.state.agent_service.get_agents().__len__())
        app.state.agent_service.reset_agents(num_agents)
        app.state.simulation_running = False
        await broadcast_agent_update(app)
        await websocket.send_json({"status": "simulation_reset"})
    
    elif command == "update_speed":
        speed = message.get("speed", 500)
        app.state.simulation_speed = speed
        await websocket.send_json({"status": "speed_updated"})
    
    elif command == "get_agents":
        agents_data = app.state.agent_service.get_agents_data()
        await websocket.send_json({"type": "agent_update", "data": agents_data})
    
    elif command == "get_conversations":
        conversations = app.state.conversation_service.get_conversations()
        await websocket.send_json({"type": "conversation_update", "data": conversations})
    
    elif command == "ping":
        await websocket.send_json({"type": "pong", "time": message.get("time", 0)})
    
    else:
        logger.warning(f"Unknown command: {command}")
        await websocket.send_json({"error": f"Unknown command: {command}"})

async def broadcast_agent_update(app):
    """Broadcast agent updates to all connected clients."""
    if not connected_clients:
        return
    
    agents_data = app.state.agent_service.get_agents_data()
    
    message = {
        "type": "agent_update",
        "data": agents_data
    }
    
    await broadcast_message(message)

async def broadcast_conversation_update(app):
    """Broadcast conversation updates to all connected clients."""
    if not connected_clients:
        return
    
    conversations = app.state.conversation_service.get_conversations()
    
    message = {
        "type": "conversation_update",
        "data": conversations
    }
    
    await broadcast_message(message)

async def broadcast_message(message: Dict[str, Any]):
    """Broadcast a message to all connected WebSocket clients."""
    disconnected_clients = []
    
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
            disconnected_clients.append(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)


async def ensure_conversation_broadcast(app):
    """
    Periodically checks for new conversations and broadcasts them.
    This ensures conversations are sent even if the regular broadcast
    mechanism somehow fails.
    """
    while True:
        try:
            await broadcast_conversation_update(app)
            # Wait for 2 seconds before checking again
            await asyncio.sleep(2)
        except Exception as e:
            logger.error(f"Error in conversation broadcast: {e}")
            await asyncio.sleep(2)
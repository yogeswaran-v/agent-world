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
            """This file intentionally left blank. WebSocket endpoint is now handled in main.py only."""
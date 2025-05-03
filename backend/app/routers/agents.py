from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
import logging

from app.models.pydantic_models import AgentResponse, AgentCreate, SimulationStatus
from app.core.config import settings

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[AgentResponse])
async def get_all_agents(request: Request) -> List[Dict[str, Any]]:
    """Get all agents in the simulation."""
    agent_service = request.app.state.agent_service
    return agent_service.get_agents_data()

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int, request: Request) -> Dict[str, Any]:
    """Get a specific agent by ID."""
    agent_service = request.app.state.agent_service
    agent = agent_service.get_agent(agent_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent with ID {agent_id} not found")
    
    return agent.to_dict()

@router.post("/reset", response_model=SimulationStatus)
async def reset_simulation(request: Request, num_agents: int = settings.NUM_AGENTS) -> Dict[str, Any]:
    """Reset the simulation with a new set of agents."""
    agent_service = request.app.state.agent_service
    
    # Validate input
    if num_agents < 1 or num_agents > 100:
        raise HTTPException(status_code=400, detail="Number of agents must be between 1 and 100")
    
    # Reset agents
    agent_service.reset_agents(num_agents)
    
    # Stop simulation
    request.app.state.simulation_running = False
    
    return {"status": "reset", "num_agents": num_agents, "running": False}

@router.post("/start", response_model=SimulationStatus)
async def start_simulation(request: Request) -> Dict[str, Any]:
    """Start the simulation."""
    request.app.state.simulation_running = True
    return {"status": "started", "running": True}

@router.post("/stop", response_model=SimulationStatus)
async def stop_simulation(request: Request) -> Dict[str, Any]:
    """Stop the simulation."""
    request.app.state.simulation_running = False
    return {"status": "stopped", "running": False}

@router.post("/speed", response_model=SimulationStatus)
async def set_simulation_speed(speed: int, request: Request) -> Dict[str, Any]:
    """Set the simulation speed (in milliseconds per update)."""
    # Validate input
    if speed < 100 or speed > 5000:
        raise HTTPException(status_code=400, detail="Speed must be between 100 and 5000 milliseconds")
    
    request.app.state.simulation_speed = speed
    
    return {
        "status": "speed_updated", 
        "speed": speed, 
        "running": request.app.state.simulation_running
    }

@router.get("/conversations", response_model=List[str])
async def get_conversations(request: Request) -> List[str]:
    """Get all conversations between agents."""
    conversation_service = request.app.state.conversation_service
    return conversation_service.get_conversations()
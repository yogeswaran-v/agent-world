from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AgentBase(BaseModel):
    """Base model for agent data."""
    name: str
    color: str
    personality: Optional[str] = None
    goal: Optional[str] = None

class AgentCreate(AgentBase):
    """Model for creating a new agent."""
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)

class AgentResponse(AgentBase):
    """Model for agent response data."""
    id: int
    x: int
    y: int
    target_x: int
    target_y: int
    memory: List[str] = []
    last_thought: str = ""
    move_progress: float = 1.0
    
    class Config:
        orm_mode = True

class AgentUpdate(BaseModel):
    """Model for updating agent data."""
    x: Optional[int] = None
    y: Optional[int] = None
    last_thought: Optional[str] = None

class ConversationResponse(BaseModel):
    """Model for conversation data."""
    timestamp: str
    content: str

class SimulationStatus(BaseModel):
    """Model for simulation status."""
    status: str
    running: bool
    num_agents: Optional[int] = None
    speed: Optional[int] = None

class WebSocketMessage(BaseModel):
    """Model for WebSocket messages."""
    type: str
    data: Dict[str, Any]

class AgentThoughtRequest(BaseModel):
    """Model for requesting an agent thought."""
    agent_id: int
    nearby_agent_ids: List[int] = []
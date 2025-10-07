import random
from typing import List, Dict, Any, Optional, Tuple
import logging

from app.models.agent import Agent
from app.core.config import settings

logger = logging.getLogger(__name__)

class AgentService:
    """Service for managing agents in the simulation."""
    
    def __init__(self):
        """Initialize the agent service with a list of agents."""
        self.agents: List[Agent] = []
        self.world_size = settings.WORLD_SIZE
        self.conversation_queue: List[Tuple[Agent, Agent]] = []
        # Initialize agents
        self.reset_agents(settings.NUM_AGENTS)
        logger.info(f"Initialized AgentService with {len(self.agents)} agents")
    
    def reset_agents(self, num_agents: int) -> None:
        """Reset agents with the specified number."""
        agent_names = [
            "Ava", "Neo", "Luna", "Orion", "Zephyr", 
            "Nova", "Atlas", "Echo", "Iris", "Milo",
            "Ava", "Neo", "Luna", "Orion", "Zephyr", 
            "Nova", "Atlas", "Echo", "Iris", "Milo",
            "Ava", "Neo", "Luna", "Orion", "Zephyr", 
            "Nova", "Atlas", "Echo", "Iris", "Milo"
        ]
        
        # Parse colors from settings
        agent_colors = settings.AGENT_COLORS.split(",")
        
        # Clear existing agents
        self.agents = []
        self.conversation_queue = []
        
        # Create new agents
        for i in range(min(num_agents, len(agent_names))):
            agent = Agent(
                agent_id=i,
                name=agent_names[i],
                x=random.randint(150, 350),  # Spawn within terrain area
                y=random.randint(150, 300),  # Spawn within terrain area
                color=agent_colors[i % len(agent_colors)]
            )
            self.agents.append(agent)
        
        logger.info(f"Reset to {len(self.agents)} agents")
    
    def get_agents(self) -> List[Agent]:
        """Get all agents."""
        return self.agents
    
    def get_agents_data(self) -> List[Dict[str, Any]]:
        """Get all agents as serializable dictionaries."""
        return [agent.to_dict() for agent in self.agents]
    
    def get_agent(self, agent_id: int) -> Optional[Agent]:
        """Get a specific agent by ID."""
        for agent in self.agents:
            if agent.id == agent_id:
                return agent
        return None
    
    def update_agents(self) -> None:
        """Update all agents (move, think, interact)."""
        for agent in self.agents:
            agent.move(self.agents, self.world_size, self.conversation_queue)
    
    def get_agent_for_thinking(self) -> List[Tuple[Agent, List[Agent]]]:
        """Get agents that need to think."""
        thinking_agents = []
        
        for agent in self.agents:
            if agent.thinking_cooldown <= 0 and random.random() < settings.THINK_CHANCE:
                thinking_agents.append((agent, self.agents))
                agent.thinking_cooldown = settings.THINK_COOL_DOWN
        
        return thinking_agents
    
    def get_conversation_queue(self) -> List[Tuple[Agent, Agent]]:
        """Get the current conversation queue."""
        queue_copy = self.conversation_queue.copy()
        self.conversation_queue = []  # Clear the queue after getting it
        return queue_copy
    
    def add_conversation(self, agent1: Agent, agent2: Agent) -> None:
        """Add a conversation to the queue."""
        self.conversation_queue.append((agent1, agent2))
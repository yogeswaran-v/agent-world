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
        # Process agents sequentially but efficiently
        for agent in self.agents:
            agent.move(self.agents, self.world_size, self.conversation_queue)
    
    def update_agents_parallel(self) -> None:
        """Update all agents using parallel threads for maximum performance and independence."""
        import threading
        import time
        import random
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        logger.debug(f"Starting parallel update for {len(self.agents)} agents")
        
        def update_single_agent(agent_data):
            """Update a single agent in its own thread."""
            agent, agent_index, stagger_delay = agent_data
            
            try:
                # Add staggered delay to prevent perfect synchronization
                if stagger_delay > 0:
                    time.sleep(stagger_delay)
                
                # Add small random delay for each agent to create natural movement patterns
                random_delay = random.uniform(0.01, 0.05)  # 10-50ms random delay
                time.sleep(random_delay)
                
                # Create a thread-safe copy of agent list for collision detection
                agents_copy = self.agents.copy()
                
                # Update agent position - each agent moves independently
                agent.move(agents_copy, self.world_size, self.conversation_queue)
                
                logger.debug(f"Thread {agent_index}: Updated agent {agent.name} to position ({agent.x}, {agent.y})")
                return f"Agent {agent.name} updated successfully"
                
            except Exception as e:
                error_msg = f"Error updating agent {agent.name} in thread {agent_index}: {e}"
                logger.error(error_msg)
                return error_msg
        
        # Prepare agent data with staggered delays
        agent_data_list = []
        for i, agent in enumerate(self.agents):
            # Stagger agent updates with increasing delays (0ms, 20ms, 40ms, etc.)
            stagger_delay = i * 0.02  # 20ms delay between each agent start
            agent_data_list.append((agent, i, stagger_delay))
        
        # Use ThreadPoolExecutor for efficient parallel processing
        max_workers = min(len(self.agents), 10)  # Limit concurrent threads to prevent resource exhaustion
        
        with ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="AgentWorker") as executor:
            # Submit all agent update tasks
            future_to_agent = {
                executor.submit(update_single_agent, agent_data): agent_data[0].name 
                for agent_data in agent_data_list
            }
            
            # Collect results as they complete
            completed_count = 0
            error_count = 0
            
            for future in as_completed(future_to_agent, timeout=5.0):  # 5 second timeout
                agent_name = future_to_agent[future]
                try:
                    result = future.result()
                    if "Error" in result:
                        error_count += 1
                        logger.warning(f"Agent {agent_name}: {result}")
                    else:
                        completed_count += 1
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Thread exception for agent {agent_name}: {e}")
        
        # Log summary
        total_agents = len(self.agents)
        logger.info(f"Parallel update completed: {completed_count}/{total_agents} agents updated successfully, {error_count} errors")
        
        if error_count > total_agents // 2:  # If more than half failed
            logger.warning(f"High error rate in parallel update ({error_count}/{total_agents}), consider fallback to synchronous mode")
    
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
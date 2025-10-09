import asyncio
import hashlib
import random
from typing import List, Dict, Any, Tuple
from app.models.agent import Agent
from app.core.config import settings
import logging
logger = logging.getLogger(__name__)
import openai


class ThinkingService:
    def __init__(self):
        # Initialize multiple LLM clients for different agents
        self.llm_clients = {}
        for service_id, service_config in settings.OLLAMA_SERVICES.items():
            try:
                base_url = service_config["base_url"] if isinstance(service_config, dict) else service_config
                client = openai.OpenAI(
                    base_url=base_url,
                    api_key="dummy"  # Ollama doesn't need real API key
                )
                self.llm_clients[service_id] = client
                logger.info(f"Initialized LLM client for service {service_id}: {base_url}")
            except Exception as e:
                logger.error(f"Failed to initialize LLM client for {service_id}: {e}")
        
        self.openai_client = self.llm_clients.get("service_1")
        self._thought_cache = {}
        self._pending_agents = []
        self._agent_positions_history = {}
        
    def _get_llm_client_for_agent(self, agent: Agent) -> openai.OpenAI:
        """Get the appropriate LLM client for the given agent."""
        service_keys = list(self.llm_clients.keys())
        if not service_keys:
            return self.openai_client
        
        service_index = hash(agent.id) % len(service_keys)
        service_key = service_keys[service_index]
        
        client = self.llm_clients.get(service_key, self.openai_client)
        logger.debug(f"Agent {agent.name} using LLM service: {service_key}")
        return client
    
    def add_agents_to_thinking_queue(self, agents: List[Tuple[Agent, List[Agent]]]) -> None:
        """Add agents to the thinking queue for batch processing."""
        self._pending_agents.extend(agents)
        
    def _generate_cache_key(self, agent: Agent, nearby_agents: List[Dict]) -> str:
        """Generate a cache key based on agent state and nearby agents."""
        key_parts = [
            agent.name,
            agent.personality,
            str(len(agent.memory)),
            str(len(nearby_agents))
        ]
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()[:16]
    
    def process_thinking_batch(self) -> None:
        """Process all pending thinking requests synchronously."""
        try:
            current_batch = self._pending_agents.copy()
            self._pending_agents = []
            
            if not current_batch:
                return
                
            logger.info(f"Processing thinking batch for {len(current_batch)} agents")
            
            for agent, all_agents in current_batch:
                # Generate simple directional thought
                directions = ["north", "south", "east", "west"]
                direction = random.choice(directions)
                
                thoughts = [
                    f"I think I'll explore {direction} for a while.",
                    f"Let me try going {direction} to see what happens.",
                    f"Moving {direction} feels right for my goals."
                ]
                
                agent.next_thought = random.choice(thoughts)
                
        except Exception as e:
            logger.error(f"Error in thinking batch process: {e}")
    
    def add_pending_agents(self, agents: List[Tuple[Agent, List[Agent]]]) -> None:
        """Add pending agents from external sources."""
        self._pending_agents.extend(agents)

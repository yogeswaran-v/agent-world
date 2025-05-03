import time
import random
import logging
from typing import List, Dict, Any, Tuple, Optional
import asyncio

from openai import OpenAI

from app.models.agent import Agent
from app.core.config import settings

logger = logging.getLogger(__name__)

class ThinkingService:
    """Service for managing agent thinking processes."""
    
    def __init__(self):
        """Initialize the thinking service."""
        self._pending_agents: List[Tuple[Agent, List[Agent]]] = []
        self._thought_cache: Dict[int, str] = {}  # Simple cache for similar thinking scenarios
        
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            try:
                # Use synchronous OpenAI client instead of AsyncOpenAI
                from openai import OpenAI
                self.openai_client = OpenAI(
                    base_url=settings.OPENAI_BASE_URL,
                    api_key=settings.OPENAI_API_KEY
                )
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        logger.info("Initialized ThinkingService")
    
    def register_agent_for_thinking(self, agent: Agent, nearby_agents: List[Agent]) -> None:
        """Register an agent to be included in the next batch thinking process."""
        self._pending_agents.append((agent, nearby_agents))
    
    def _generate_cache_key(self, agent: Agent, nearby_agent_info: List[Dict[str, Any]]) -> int:
        """Generate a cache key based on agent state and nearby agents."""
        # Simple cache key based on position, nearby agents, and a time window (changes every 30 seconds)
        time_window = int(time.time() / 30)  # Changes every 30 seconds
        position_bucket = (int(agent.x / 20), int(agent.y / 20))  # Position bucketed to reduce variations
        
        # Hash nearby agents by distance buckets
        nearby_hash = hash(tuple(sorted([(a['name'], int(a['distance'] / 10)) for a in nearby_agent_info])))
        
        return hash((agent.name, agent.personality, position_bucket, nearby_hash, time_window))
    
    async def process_thinking_batch_async(self) -> None:
        """Process all pending thinking requests in a single batch asynchronously."""
        try:
            # Get the current batch of agents
            current_batch = self._pending_agents.copy()
            self._pending_agents = []
            
            if not current_batch:
                return
                
            logger.info(f"Processing thinking batch for {len(current_batch)} agents")
            
            # If no API client, use random thoughts
            if not self.openai_client:
                for agent, _ in current_batch:
                    directions = ["north", "south", "east", "west", "stay"]
                    random_thought = f"I think I'll move {random.choice(directions)} because that seems interesting."
                    agent.next_thought = random_thought
                return
            
            # Prepare batch prompts
            tasks = []
            cached_agents = []
            
            for agent, all_agents in current_batch:
                # Calculate nearby agents for context
                nearby_agents = []
                other_agents = [a for a in all_agents if a.id != agent.id]
                
                # Calculate distances once
                agent_distances = [(a, ((agent.x - a.x)**2 + (agent.y - a.y)**2)**0.5) 
                                for a in other_agents]
                
                # Sort by distance and take closest 2
                agent_distances.sort(key=lambda x: x[1])
                closest_agents = agent_distances[:2]
                
                for nearby_agent, distance in closest_agents:
                    if distance < 100:
                        nearby_agents.append({
                            "name": nearby_agent.name,
                            "distance": distance,
                            "personality": nearby_agent.personality
                        })
                
                # Check cache first
                cache_key = self._generate_cache_key(agent, nearby_agents)
                if cache_key in self._thought_cache:
                    agent.next_thought = self._thought_cache[cache_key]
                    cached_agents.append(agent)
                    continue
                
                # Build prompt if not in cache
                prompt = f"""
                You are {agent.name}, an agent with {agent.personality} personality.
                Goal: {agent.goal}
                Position: ({agent.x}, {agent.y})
                Recent memories: {agent.memory[-2:] if agent.memory else []}
                Nearby agents: {nearby_agents}
                
                Based on this, what direction will you move (north, south, east, west, or stay)? Reply with 1-2 sentences.
                """
                
                # Create task to process this agent's thinking
                tasks.append({
                    "agent": agent,
                    "cache_key": cache_key,
                    "prompt": prompt
                })
            
            # If all agents were handled by cache, we're done
            if not tasks:
                logger.info("All agents were handled by cache")
                return
                
            # Process tasks in parallel with asyncio
            await asyncio.gather(*[self._process_agent_thought(task) for task in tasks])
            
        except Exception as e:
            logger.error(f"Error in thinking batch process: {e}")
    
    async def _process_agent_thought(self, task: Dict[str, Any]) -> None:
        """Process a single agent's thought."""
        try:
            if not self.openai_client:
                # Create a simple random thought if no client is available
                directions = ["north", "south", "east", "west", "stay"]
                random_thought = f"I think I'll move {random.choice(directions)} because that seems interesting."
                task["agent"].next_thought = random_thought
                self._thought_cache[task["cache_key"]] = random_thought
                return
                
            # Create a synchronous request
            response = self.openai_client.chat.completions.create(
                model=settings.MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant simulating an autonomous agent."},
                    {"role": "user", "content": task["prompt"]}
                ],
                max_tokens=40
            )
            thought = response.choices[0].message.content
            
            # Update agent and cache
            task["agent"].next_thought = thought
            self._thought_cache[task["cache_key"]] = thought
            
            # Limit cache size
            if len(self._thought_cache) > 500:
                # Remove random items to avoid unbounded growth
                keys_to_remove = random.sample(list(self._thought_cache.keys()), 100)
                for key in keys_to_remove:
                    self._thought_cache.pop(key, None)
        
        except Exception as e:
            logger.error(f"Error in agent thinking for {task['agent'].name}: {e}")
            task["agent"].next_thought = "I'm not sure where to go next."
            
                
    def process_thinking_batch(self) -> None:
        """Process all pending thinking requests in a single batch (synchronous version)."""
        try:
            # Get the current batch of agents
            current_batch = self._pending_agents.copy()
            self._pending_agents = []
            
            if not current_batch:
                return
                
            logger.info(f"Processing thinking batch for {len(current_batch)} agents (sync)")
            
            # Process each agent
            for agent, all_agents in current_batch:
                # For synchronous version, just use random thoughts or cached thoughts
                # Calculate nearby agents for context
                nearby_agents = []
                other_agents = [a for a in all_agents if a.id != agent.id]
                
                # Calculate distances once
                agent_distances = [(a, ((agent.x - a.x)**2 + (agent.y - a.y)**2)**0.5) 
                                for a in other_agents]
                
                # Sort by distance and take closest 2
                agent_distances.sort(key=lambda x: x[1])
                closest_agents = agent_distances[:2]
                
                for nearby_agent, distance in closest_agents:
                    if distance < 100:
                        nearby_agents.append({
                            "name": nearby_agent.name,
                            "distance": distance,
                            "personality": nearby_agent.personality
                        })
                
                # Check cache first
                cache_key = self._generate_cache_key(agent, nearby_agents)
                if cache_key in self._thought_cache:
                    agent.next_thought = self._thought_cache[cache_key]
                    continue
                
                # If not in cache, generate simple thought
                directions = ["north", "south", "east", "west", "stay"]
                personality_based_reasons = {
                    "Curious and explorative": ["looks interesting", "might find something new", "haven't been there yet"],
                    "Analytical and cautious": ["seems safer", "better vantage point", "logical choice"],
                    "Social and friendly": ["might meet someone", "where others are gathering", "crowded area"],
                    "Independent and resourceful": ["good resources there", "strategic location", "useful position"],
                    "Creative and imaginative": ["feels right", "inspiring direction", "curious what's over there"]
                }
                
                reason = random.choice(personality_based_reasons.get(agent.personality, ["seems interesting"]))
                direction = random.choice(directions)
                
                thought = f"I think I'll move {direction} because it {reason}."
                agent.next_thought = thought
                
                # Cache the thought
                self._thought_cache[cache_key] = thought
                
        except Exception as e:
            logger.error(f"Error in thinking batch process (sync): {e}")
    
    def add_pending_agents(self, agents: List[Tuple[Agent, List[Agent]]]) -> None:
        """Add pending agents from external sources."""
        self._pending_agents.extend(agents)
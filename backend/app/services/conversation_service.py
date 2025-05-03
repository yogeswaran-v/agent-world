# conversation_service.py
import time
import random
import logging
from typing import List, Dict, Any, Tuple, Optional
import asyncio
import inspect


from openai import AsyncOpenAI

from app.models.agent import Agent
from app.core.config import settings

logger = logging.getLogger(__name__)

logger.info(f"OpenAI client parameters: {inspect.signature(AsyncOpenAI.__init__)}")


class ConversationService:
    """Service for managing conversations between agents."""
    
    def __init__(self):
        """Initialize the conversation service."""
        self.conversation_history: List[str] = []
        self._conversation_cache: Dict[int, str] = {}  # Cache for similar conversation scenarios
        self._pending_conversations: List[Tuple[Agent, Agent]] = []
        
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            try:
                # Use synchronous OpenAI client instead of AsyncOpenAI to avoid compatibility issues
                from openai import OpenAI
                self.openai_client = OpenAI(
                    base_url=settings.OPENAI_BASE_URL,
                    api_key=settings.OPENAI_API_KEY
                )
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        logger.info("Initialized ConversationService")
    
    def register_conversation(self, agent1: Agent, agent2: Agent) -> bool:
        """Register a conversation between two agents."""
        # Check if either agent is already in a pending conversation
        for a1, a2 in self._pending_conversations:
            if agent1.id in (a1.id, a2.id) or agent2.id in (a1.id, a2.id):
                return False  # Skip if either agent is busy
        
        # Add to pending conversations
        self._pending_conversations.append((agent1, agent2))
        return True
    
    async def process_conversation_batch_async(self) -> None:
        """Process all pending conversations asynchronously."""
        if not self._pending_conversations:
            return
        
        current_batch = self._pending_conversations.copy()
        self._pending_conversations = []
        
        logger.info(f"Processing conversation batch with {len(current_batch)} conversations")
        
        # Process each conversation
        for agent1, agent2 in current_batch:
            await self._generate_conversation_async(agent1, agent2)
    
    def process_conversation_batch(self) -> None:
        """Process all pending conversations (sync version for non-async contexts)."""
        if not self._pending_conversations:
            return
        
        current_batch = self._pending_conversations.copy()
        self._pending_conversations = []
        
        logger.info(f"Processing conversation batch with {len(current_batch)} conversations")
        
        # Process each conversation
        for agent1, agent2 in current_batch:
            self._generate_conversation(agent1, agent2)
    
    def _generate_conversation_cache_key(self, agent1: Agent, agent2: Agent) -> int:
        """Generate a cache key for conversation based on agents' state."""
        # Simple cache key based on both agents
        a1_factors = (agent1.name, agent1.personality, agent1.goal)
        a2_factors = (agent2.name, agent2.personality, agent2.goal)
        # Make sure order doesn't matter
        key_parts = sorted([a1_factors, a2_factors])
        # Include a time window (1 hour) to refresh cache periodically
        time_window = int(time.time() / 3600)
        return hash((tuple(key_parts), time_window))
    
    async def _generate_conversation_async(self, agent1: Agent, agent2: Agent) -> None:
        """Generate a conversation between two agents asynchronously."""
        try:
            # Check cache first
            cache_key = self._generate_conversation_cache_key(agent1, agent2)
            if cache_key in self._conversation_cache:
                conversation = self._conversation_cache[cache_key]
                # Add some variation to cached conversations
                lines = conversation.split("\n")
                if len(lines) > 3:
                    # Randomly modify a line for variation
                    modify_index = random.randint(1, len(lines) - 1)
                    conversation = "\n".join(lines[:modify_index] + [lines[modify_index] + " Actually, let me rethink that..."] + lines[modify_index+1:])
            
            elif self.openai_client:
                # Create a prompt for conversation
                prompt = f"""
                Generate a natural conversation between two agents in a virtual world. 
                
                {agent1.name} ({agent1.personality}, Goal: {agent1.goal})
                {agent2.name} ({agent2.personality}, Goal: {agent2.goal})
                
                They have just met at coordinates ({agent1.x}, {agent1.y}) in the world.
                Make the conversation 4-7 turns and reflect their personalities and goals.
                Don't include any system messages or instructions. Just the dialogue.
                Format as: 
                "{agent1.name}: [statement]"
                "{agent2.name}: [response]"
                """
                
                # Call API for conversation generation (synchronous version)
                try:
                    response = self.openai_client.chat.completions.create(
                        model=settings.MODEL,
                        messages=[
                            {"role": "system", "content": "You are generating character-appropriate dialogue."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=200
                    )
                    
                    conversation = response.choices[0].message.content
                    
                    # Cache the conversation
                    self._conversation_cache[cache_key] = conversation
                    
                    # Limit cache size
                    if len(self._conversation_cache) > 200:
                        # Remove random items
                        keys_to_remove = random.sample(list(self._conversation_cache.keys()), 50)
                        for key in keys_to_remove:
                            self._conversation_cache.pop(key, None)
                except Exception as e:
                    # Fallback if API call fails
                    logger.error(f"API error: {e}")
                    conversation = self._generate_fallback_conversation(agent1, agent2)
            
            else:
                # Placeholder when no API client
                conversation = self._generate_fallback_conversation(agent1, agent2)
            
            # Add timestamp
            timestamp = time.strftime("%H:%M:%S")
            conversation_with_time = f"[{timestamp}] {conversation}"
            
            # Add to global conversation history
            self.conversation_history.append(conversation_with_time)
            
            # Limit conversation history size
            if len(self.conversation_history) > settings.MAX_CONVERSATIONS:
                self.conversation_history.pop(0)
            
            # Record in agents' memory
            agent1._add_memory(f"{agent1.name} Talked with {agent2.name}")
            agent2._add_memory(f"{agent2.name} Talked with {agent1.name}")
            
        except Exception as e:
            logger.error(f"Error generating conversation: {e}")

    def _generate_fallback_conversation(self, agent1: Agent, agent2: Agent) -> str:
        """Generate a fallback conversation when API calls fail."""
        return (
            f"{agent1.name}: Hi {agent2.name}, how's your exploration going?\n"
            f"{agent2.name}: Good! I'm focused on my goal to {agent2.goal.lower()}.\n"
            f"{agent1.name}: That's interesting! As a {agent1.personality.lower()} type, I'm more into {agent1.goal.lower()}.\n"
            f"{agent2.name}: We should collaborate sometime!"
        )
    
    def _generate_conversation(self, agent1: Agent, agent2: Agent) -> None:
        """Generate a conversation between two agents (synchronous version)."""
        try:
            # Check cache first
            cache_key = self._generate_conversation_cache_key(agent1, agent2)
            if cache_key in self._conversation_cache:
                conversation = self._conversation_cache[cache_key]
                # Add some variation to cached conversations
                lines = conversation.split("\n")
                if len(lines) > 3:
                    # Randomly modify a line for variation
                    modify_index = random.randint(1, len(lines) - 1)
                    conversation = "\n".join(lines[:modify_index] + [lines[modify_index] + " Actually, let me rethink that..."] + lines[modify_index+1:])
            else:
                # Simplified non-async placeholder
                sample_dialogue = (
                    f"{agent1.name}: Hi {agent2.name}, how's your exploration going?\n"
                    f"{agent2.name}: Good! I'm focused on my goal to {agent2.goal.lower()}.\n"
                    f"{agent1.name}: That's interesting! As a {agent1.personality.lower()} type, I'm more into {agent1.goal.lower()}.\n"
                    f"{agent2.name}: We should collaborate sometime!"
                )
                conversation = sample_dialogue
            
            # Add timestamp
            timestamp = time.strftime("%H:%M:%S")
            conversation_with_time = f"[{timestamp}] {conversation}"
            
            # Add to global conversation history
            self.conversation_history.append(conversation_with_time)
            
            # Limit conversation history size
            if len(self.conversation_history) > settings.MAX_CONVERSATIONS:
                self.conversation_history.pop(0)
            
            # Record in agents' memory
            agent1._add_memory(f"{agent1.name} Talked with {agent2.name}")
            agent2._add_memory(f"{agent2.name} Talked with {agent1.name}")
            
        except Exception as e:
            logger.error(f"Error generating conversation: {e}")
    
    def get_conversations(self) -> List[str]:
        """Get all conversations."""
        return self.conversation_history
    
    def add_pending_conversations(self, conversations: List[Tuple[Agent, Agent]]) -> None:
        """Add pending conversations from external sources."""
        self._pending_conversations.extend(conversations)
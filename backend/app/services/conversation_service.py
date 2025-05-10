# Let's fix the backend/app/services/conversation_service.py to ensure conversations are properly generated and broadcasted

from typing import List, Dict, Any, Tuple, Optional
import time
import random
import logging
import asyncio

from app.models.agent import Agent
from app.core.config import settings

logger = logging.getLogger(__name__)

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
                    api_key=settings.OPENAI_API_KEY,
                    # Add timeout to prevent hanging
                    timeout=10.0
                )
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        else:
            logger.warning("No OpenAI API key provided, using fallback conversations")
        
        logger.info("Initialized ConversationService")
        
    def add_pending_conversations(self, conversations: List[Tuple[Agent, Agent]]) -> None:
        """Add pending conversations from external sources."""
        self._pending_conversations.extend(conversations)
        logger.debug(f"Added {len(conversations)} conversations to pending queue. Queue size: {len(self._pending_conversations)}")
    
    def get_conversations(self) -> List[str]:
        """Get all conversations."""
        logger.debug(f"Getting {len(self.conversation_history)} conversations")
        return self.conversation_history
    
    # The key method that processes conversation batches
    async def process_conversation_batch_async(self) -> None:
        """Process all pending conversations asynchronously."""
        if not self._pending_conversations:
            logger.debug("No pending conversations to process")
            return
        
        current_batch = self._pending_conversations.copy()
        self._pending_conversations = []
        
        logger.info(f"Processing conversation batch with {len(current_batch)} conversations")
        
        # Process each conversation
        for agent1, agent2 in current_batch:
            try:
                # Generate the conversation
                await self._generate_conversation_async(agent1, agent2)
            except Exception as e:
                logger.error(f"Async conversation generation failed: {e}")
                self._generate_conversation(agent1, agent2)
    
    async def _generate_conversation_async(self, agent1: Agent, agent2: Agent) -> None:
        """Generate a conversation between two agents asynchronously."""
        try:
            timestamp = time.strftime("%H:%M:%S")
            
            if self.openai_client:
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
                except Exception as e:
                    logger.error(f"API error: {e}")
                    conversation = self._generate_fallback_conversation(agent1, agent2)
            else:
                # Fallback if no API client is available
                conversation = self._generate_fallback_conversation(agent1, agent2)
            
            # Add timestamp
            conversation_with_time = f"[{timestamp}] {conversation}"
            
            # Add to global conversation history
            self.conversation_history.append(conversation_with_time)
            logger.info(f"Added new conversation between {agent1.name} and {agent2.name}")
            
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
        templates = [
            (
                f"{agent1.name}: Hi {agent2.name}, how's your exploration going?\n"
                f"{agent2.name}: Good! I'm focused on my goal to {agent2.goal.lower()}.\n"
                f"{agent1.name}: That's interesting! As a {agent1.personality.lower()} type, I'm more into {agent1.goal.lower()}.\n"
                f"{agent2.name}: We should collaborate sometime!"
            ),
            (
                f"{agent1.name}: Hello there, {agent2.name}! I've been wandering around looking for ways to {agent1.goal.lower()}.\n"
                f"{agent2.name}: What a coincidence! I'm trying to {agent2.goal.lower()} myself.\n"
                f"{agent1.name}: Perhaps we could work together?\n"
                f"{agent2.name}: That sounds like a good idea!"
            ),
            (
                f"{agent1.name}: Oh, hello! I didn't expect to run into someone here.\n"
                f"{agent2.name}: Same here! I'm {agent2.name}, and I'm on a mission to {agent2.goal.lower()}.\n"
                f"{agent1.name}: I'm {agent1.name}. Being {agent1.personality.lower()}, I find that fascinating.\n"
                f"{agent2.name}: Thanks! I hope our paths cross again soon."
            )
        ]
        return random.choice(templates)
    
    def process_conversation_batch(self) -> None:
        """Process all pending conversations (sync version for non-async contexts)."""
        if not self._pending_conversations:
            return
        
        current_batch = self._pending_conversations.copy()
        self._pending_conversations = []
        
        logger.info(f"Processing conversation batch with {len(current_batch)} conversations (sync)")
        
        # Process each conversation
        for agent1, agent2 in current_batch:
            self._generate_conversation(agent1, agent2)
    
    def _generate_conversation(self, agent1: Agent, agent2: Agent) -> None:
        """Generate a conversation between two agents (synchronous version)."""
        try:
            # Simplified non-async placeholder
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
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
        """Initialize the conversation service with multiple LLM clients."""
        self.conversation_history: List[str] = []
        self._conversation_cache: Dict[int, str] = {}  # Cache for similar conversation scenarios
        self._pending_conversations: List[Tuple[Agent, Agent]] = []
        
        # Initialize multiple OpenAI clients for parallel processing
        self.llm_clients = {}
        self.openai_client = None  # Default fallback client
        
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                
                # Initialize per-agent LLM services for true parallelism
                for agent_key, service_config in settings.OLLAMA_SERVICES.items():
                    try:
                        client = OpenAI(
                            base_url=service_config["base_url"],
                            api_key=settings.OPENAI_API_KEY,
                            timeout=5.0  # Faster timeout for lighter models
                        )
                        self.llm_clients[agent_key] = {
                            "client": client, 
                            "model": service_config["model"]
                        }
                        logger.info(f"Initialized LLM client for {agent_key} with {service_config['model']}")
                    except Exception as e:
                        logger.warning(f"Failed to initialize LLM client for {agent_key}: {e}")
                
                # Default fallback client
                self.openai_client = OpenAI(
                    base_url=settings.OPENAI_BASE_URL,
                    api_key=settings.OPENAI_API_KEY,
                    timeout=5.0
                )
                logger.info(f"OpenAI clients initialized: {len(self.llm_clients)} specialized + 1 fallback")
                
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI clients: {e}")
        else:
            logger.warning("No OpenAI API key provided, using fallback conversations")
        
        logger.info("Initialized ConversationService")
    
    def _get_llm_client_for_agent(self, agent: Agent) -> Tuple[Any, str]:
        """Get the appropriate LLM client and model for an agent."""
        agent_key = f"agent_{agent.id % len(settings.OLLAMA_SERVICES)}"
        
        if agent_key in self.llm_clients:
            client_info = self.llm_clients[agent_key]
            return client_info["client"], client_info["model"]
        
        # Fallback to default client
        return self.openai_client, settings.FALLBACK_MODEL if hasattr(settings, 'FALLBACK_MODEL') else settings.MODEL
        
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
        """Process all pending conversations asynchronously with limited concurrency."""
        if not self._pending_conversations:
            logger.debug("No pending conversations to process")
            return
        
        # Limit batch size to prevent Ollama overload (max 2 concurrent for 3 agents)
        MAX_CONCURRENT_CONVERSATIONS = 2
        current_batch = self._pending_conversations[:MAX_CONCURRENT_CONVERSATIONS]
        self._pending_conversations = self._pending_conversations[MAX_CONCURRENT_CONVERSATIONS:]
        
        logger.info(f"Processing conversation batch with {len(current_batch)} conversations (max {MAX_CONCURRENT_CONVERSATIONS} concurrent)")
        
        # Process conversations with limited concurrency using semaphore
        semaphore = asyncio.Semaphore(2)  # Only 2 concurrent Ollama requests
        
        async def process_single_conversation(agent1: Agent, agent2: Agent):
            async with semaphore:
                try:
                    # Generate the conversation with timeout
                    await asyncio.wait_for(
                        self._generate_conversation_async(agent1, agent2),
                        timeout=8.0  # 8 second timeout per conversation
                    )
                except asyncio.TimeoutError:
                    logger.warning(f"Conversation timeout between {agent1.name} and {agent2.name}, using fallback")
                    self._generate_conversation(agent1, agent2)
                except Exception as e:
                    logger.error(f"Async conversation generation failed: {e}")
                    self._generate_conversation(agent1, agent2)
        
        # Process all conversations concurrently but with limited concurrency
        if current_batch:
            await asyncio.gather(*[
                process_single_conversation(agent1, agent2) 
                for agent1, agent2 in current_batch
            ], return_exceptions=True)
    
    async def _generate_conversation_async(self, agent1: Agent, agent2: Agent) -> None:
        """Generate a conversation between two agents using dedicated LLM clients."""
        try:
            timestamp = time.strftime("%H:%M:%S")
            
            # Get dedicated LLM client for the primary agent to avoid blocking
            client, model = self._get_llm_client_for_agent(agent1)
            
            if client:
                # Create a much shorter, faster prompt for ultra-light models
                prompt = f"""Brief chat: {agent1.name} ({agent1.personality}) meets {agent2.name} ({agent2.personality}) at ({agent1.x},{agent1.y}). Generate 2-3 short exchanges."""
                
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=80,  # Much shorter for speed
                        temperature=0.7,
                        timeout=3.0  # Very fast timeout
                    )
                    
                    conversation = response.choices[0].message.content.strip()
                    logger.debug(f"Generated conversation using {model} via dedicated client")
                    
                except Exception as e:
                    logger.warning(f"Dedicated LLM failed for {agent1.name}, using fallback: {e}")
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
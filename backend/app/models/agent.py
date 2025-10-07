import random
import numpy as np
import time
from typing import List, Dict, Any, Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class Agent:
    """Agent class representing an autonomous entity in the simulated world."""
    
    def __init__(self, agent_id: int, name: str, x: int, y: int, color: str):
        self.id = agent_id
        self.name = name
        self.x = x
        self.y = y
        # Target coordinates for smooth movement
        self.target_x = x
        self.target_y = y
        self.color = color
        self.memory: List[str] = []
        self.personality = self._generate_personality()
        self.goal = self._generate_goal()
        self.last_thought = ""
        self.conversations: List[str] = []
        self.conversation_cooldown = 0  # Cooldown to prevent conversation spam
        self.move_enabled = True  # Add this flag

        
        # Improved smooth movement parameters
        self.move_progress = 1.0  # 1.0 means movement is complete
        self.last_x = x
        self.last_y = y
        
        # Movement queue for continuous animations
        self.movement_queue: List[Tuple[int, int]] = []
        self.thinking_cooldown = 0  # Limit thinking frequency
        
        # The next thought to be processed
        self.next_thought: Optional[str] = None
    
    def _generate_personality(self) -> str:
        """Generate a random personality for the agent."""
        personalities = [
            "Curious and explorative", 
            "Analytical and cautious",
            "Social and friendly",
            "Independent and resourceful",
            "Creative and imaginative"
        ]
        return random.choice(personalities)
    
    def _generate_goal(self) -> str:
        """Generate a random goal for the agent."""
        goals = [
            "Explore the entire world",
            "Interact with every other agent",
            "Collect knowledge about the environment",
            "Find an optimal location to settle",
            "Create alliances with other agents"
        ]
        return random.choice(goals)
    
    def move(self, agents: List['Agent'], world_size: int, conversation_queue: List[Tuple['Agent', 'Agent']]) -> None:
        """Move the agent in the world."""
        
        if not self.move_enabled:
            return

        # If the agent is currently conversing, do not move
        if any(task[0].id == self.id or task[1].id == self.id for task in conversation_queue):
            return
        
        # Update position with smooth interpolation
        if self.move_progress < 1.0:
            # Use a cubic easing function for smoother motion (ease-in-out)
            t = self.move_progress
            # Cubic easing: t³ * (t * (t * 6 - 15) + 10)
            smooth_t = t**3 * (t * (t * 6 - 15) + 10)
            
            # Linear interpolation between current position and target with easing
            self.x = int(self.last_x + (self.target_x - self.last_x) * smooth_t)
            self.y = int(self.last_y + (self.target_y - self.last_y) * smooth_t)
            
            # Faster progress for quicker but smooth animation
            progress_step = 0.2  # Adjust this value for speed (higher = faster)
            self.move_progress = min(self.move_progress + progress_step, 1.0)
            
            # If we have items in the movement queue and we're almost done with current movement
            # prepare for the next movement to avoid stopping
            if len(self.movement_queue) > 0 and self.move_progress >= 0.9:
                next_target = self.movement_queue.pop(0)
                # Set up next movement when current is almost complete
                self.prepare_next_movement(next_target, world_size)
        else:
            # Movement is complete, decide on next move if we don't have queued movements
            if len(self.movement_queue) == 0:
                # Decrease thinking cooldown
                if self.thinking_cooldown > 0:
                    self.thinking_cooldown -= 1
                else:
                    # Register for thinking if needed
                    if random.random() < settings.THINK_CHANCE:
                        # This will now be handled by the ThinkingService
                        self.thinking_cooldown = settings.THINK_COOL_DOWN
                
                # If we already have a next_thought, use it
                if self.next_thought:
                    self.last_thought = self.next_thought
                    self.next_thought = None
                    thought = self.last_thought
                else:
                    # Use the last thought or a simple default
                    thought = self.last_thought if self.last_thought else "I'll move randomly."
                
                # Extract direction from thought or choose randomly
                direction = self._extract_direction_from_thought(thought)
                
                # Calculate new target position based on direction
                new_target = self._calculate_target_position(direction, world_size)
                
                # Add movement to queue instead of immediately changing target
                self.movement_queue.append(new_target)
                
                # If we have something in the queue, prepare for movement
                if self.movement_queue:
                    next_target = self.movement_queue.pop(0)
                    self.prepare_next_movement(next_target, world_size)
            
            self.conversation_cooldown -= 1  # Decrease cooldown each move
        
        # Check for nearby agents to interact with
        if random.random() < 0.7:  # 70% chance to check for interactions
            self._check_for_interactions(agents, conversation_queue)
    
    def prepare_next_movement(self, target_position: Tuple[int, int], world_size: int) -> None:
        """Prepare the agent for the next movement."""
        # Store current position as last position
        self.last_x = self.x
        self.last_y = self.y
        
        # Set new target
        target_x, target_y = target_position
        
        # Ensure targets are within terrain bounds
        self.target_x = max(150, min(target_x, 350))
        self.target_y = max(150, min(target_y, 300))
        
        # Record memory if actually moving
        if self.target_x != self.x or self.target_y != self.y:
            # Determine direction for memory
            direction = "unknown"
            if abs(self.target_x - self.x) > abs(self.target_y - self.y):
                direction = "east" if self.target_x > self.x else "west"
            else:
                direction = "south" if self.target_y > self.y else "north"
                
            event = f"{self.name} moved {direction} to ({self.target_x}, {self.target_y})"
            self._add_memory(event)
            
            # Reset progress to start new movement
            self.move_progress = 0.0
    
    def _extract_direction_from_thought(self, thought: str) -> str:
        """Extract movement direction from thought text or choose randomly."""
        thought_lower = thought.lower()
        
        if 'north' in thought_lower:
            return 'north'
        elif 'south' in thought_lower:
            return 'south'
        elif 'east' in thought_lower:
            return 'east'
        elif 'west' in thought_lower:
            return 'west'
        elif 'stay' in thought_lower:
            return 'stay'
        else:
            return random.choice(['north', 'south', 'east', 'west', 'stay'])
    
    def _calculate_target_position(self, direction: str, world_size: int) -> Tuple[int, int]:
        """Calculate new target position based on direction."""
        # Current position
        curr_x, curr_y = self.x, self.y
        
        # Define terrain boundaries (agents stay within terrain area)
        min_x, max_x = 150, 350
        min_y, max_y = 150, 300
        
        # Calculate random step size (for more natural movement)
        step_size = random.randint(5, 15)
        
        if direction == 'north' and curr_y > min_y:
            return (curr_x, max(curr_y - step_size, min_y))
        elif direction == 'south' and curr_y < max_y:
            return (curr_x, min(curr_y + step_size, max_y))
        elif direction == 'east' and curr_x < max_x:
            return (min(curr_x + step_size, max_x), curr_y)
        elif direction == 'west' and curr_x > min_x:
            return (max(curr_x - step_size, min_x), curr_y)
        else:
            # Stay in place with small random movement for natural look
            jitter = random.randint(-3, 3)
            return (
                max(min_x, min(curr_x + jitter, max_x)),
                max(min_y, min(curr_y + jitter, max_y))
            )
    
    def _check_for_interactions(self, agents: List['Agent'], conversation_queue: List[Tuple['Agent', 'Agent']]) -> None:
        """Check for and initiate interactions with nearby agents."""
        # Only check when agent is not actively moving or about to move
        if self.move_progress >= 0.8:
            for agent in agents:
                if agent.id != self.id:
                    distance = np.sqrt((self.x - agent.x)**2 + (self.y - agent.y)**2)
                    if distance < settings.INTERACTION_RADIUS:  # Interaction radius
                        # Generate conversation between agents
                        if random.random() < 0.6 and self.conversation_cooldown <= 0:  # 60% chance when nearby
                            # This will add to conversation_queue
                            conversation_queue.append((self, agent))
                            self.conversation_cooldown = 2  # Set cooldown
                            agent.conversation_cooldown = 2  # Set cooldown for other agent too
                        
                        interaction = f"{self.name} met {agent.name} at ({self.x}, {self.y})"
                        self._add_memory(interaction)
    
    def _add_memory(self, event: str) -> None:
        """Add a memory to the agent's memory list."""
        timestamp = time.strftime("%H:%M:%S")
        memory_item = f"[{timestamp}] {event}"
        self.memory.append(memory_item)
        
        # Keep memory size limited
        if len(self.memory) > settings.MAX_MEMORY:
            self.memory.pop(0)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'x': self.x,
            'y': self.y,
            'target_x': self.target_x,
            'target_y': self.target_y,
            'color': self.color,
            'memory': self.memory,
            'personality': self.personality,
            'goal': self.goal,
            'last_thought': self.last_thought,
            'move_progress': self.move_progress
        }
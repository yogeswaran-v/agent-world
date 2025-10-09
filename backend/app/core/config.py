from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings."""
    
    # API configuration
    API_VERSION: str = "1.0.0"
    API_TITLE: str = "Agent World API"
    API_DESCRIPTION: str = "API for Agent World simulation"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # World settings
    WORLD_SIZE: int = 500  # size of the world in pixels
    NUM_AGENTS: int = 3    # reduced from 10 to 3 for better performance with Ollama
    MAX_MEMORY: int = 10   # max number of memories each agent can have
    MAX_CONVERSATIONS: int = 10  # max number of conversations to keep
    
    # Agent control parameters
    INTERACTION_RADIUS: int = 30  # radius for agent interactions
    THINK_CHANCE: float = 0.005   # chance of thinking each move (reduced for better performance)
    THINK_COOL_DOWN: int = 20     # number of moves before thinking again (increased cooldown)
    
    # Animation settings
    MOVE_INTERVAL: int = 100  # milliseconds between moves (much faster for better UX)
    
    # Agent colors (comma-separated list)
    AGENT_COLORS: str = "blue,red,green,orange,purple,cyan,magenta,yellow,teal,pink"
    
    # AI Model settings - using fastest, lightest models
    MODEL: str = "llama3.2:1b"  # Light model for fast responses (1.3GB, optimal balance)
    FALLBACK_MODEL: str = "llama3.2:1b"  # Same model for consistency
    
    # Multi-LLM service configuration for parallel processing
    OLLAMA_SERVICES: dict = {
        "agent_0": {"base_url": "http://ollama:11434/v1", "model": "llama3.2:1b"},
        "agent_1": {"base_url": "http://ollama2:11435/v1", "model": "llama3.2:1b"}, 
        "agent_2": {"base_url": "http://ollama3:11436/v1", "model": "llama3.2:1b"}
    }
    
    OPENAI_BASE_URL: str = "http://ollama:11434/v1"  # Default fallback
    OPENAI_API_KEY: str = "ollama"

    # Terrain features (for visualization)
    TERRAIN_FEATURES: dict = {
        'lake': {
            'x': [120, 180, 200, 140, 100, 120],
            'y': [120, 130, 180, 190, 160, 120],
            'color': 'rgba(0, 100, 220, 0.3)',
            'border': 'rgba(0, 100, 220, 0.5)',
            'name': 'Lake'
        },
        'mountains': {
            'x': [320, 350, 380],
            'y': [240, 280, 250],
            'color': 'rgba(120, 120, 120, 0.5)',
            'border': 'rgba(80, 80, 80, 0.8)',
            'name': 'Mountains'
        }
    }
    
    # Forest positions (clustered around center)
    FOREST_POSITIONS: dict = {
        'x': [240, 260, 280, 250, 270, 290, 310, 330, 340, 360, 220, 300, 320, 280, 260],
        'y': [180, 200, 170, 220, 240, 190, 210, 180, 200, 170, 160, 150, 140, 130, 160],
    }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Override settings from environment variables if needed
if os.getenv("OPENAI_API_KEY"):
    settings.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if os.getenv("OPENAI_BASE_URL"):
    settings.OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")
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
    NUM_AGENTS: int = 10   # initial number of agents in the world
    MAX_MEMORY: int = 10   # max number of memories each agent can have
    MAX_CONVERSATIONS: int = 10  # max number of conversations to keep
    
    # Agent control parameters
    INTERACTION_RADIUS: int = 30  # radius for agent interactions
    THINK_CHANCE: float = 0.01    # chance of thinking each move
    THINK_COOL_DOWN: int = 10     # number of moves before thinking again
    
    # Animation settings
    MOVE_INTERVAL: int = 500  # milliseconds between moves
    
    # Agent colors (comma-separated list)
    AGENT_COLORS: str = "blue,red,green,orange,purple,cyan,magenta,yellow,teal,pink"
    
    # AI Model settings
    MODEL: str = "llama3.2:1b"  # model for AI generation
    OPENAI_BASE_URL: str = "http://ollama:11434"
    OPENAI_API_KEY: str ="ollama"

    # Terrain features (for visualization)
    TERRAIN_FEATURES: dict = {
        'lake': {
            'x': [50, 150, 200, 100, 50],
            'y': [50, 75, 150, 125, 50],
            'color': 'rgba(0, 100, 220, 0.3)',
            'border': 'rgba(0, 100, 220, 0.5)',
            'name': 'Lake'
        },
        'mountains': {
            'x': [350, 400, 450, 350],
            'y': [300, 350, 300, 300],
            'color': 'rgba(120, 120, 120, 0.5)',
            'border': 'rgba(80, 80, 80, 0.8)',
            'name': 'Mountains'
        }
    }
    
    # Forest positions
    FOREST_POSITIONS: dict = {
        'x': list(range(300, 451, 15))[:10],  # 10 trees in x direction
        'y': list(range(50, 201, 15))[:10],   # 10 trees in y direction
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
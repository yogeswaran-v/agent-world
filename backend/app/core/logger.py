import logging
from logging.handlers import SocketHandler

def setup_logging():
    """Configure and set up logging for the application."""
    # Configure basic logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(filename)s - %(funcName)s'
    )
    
    # Create a logger
    logger = logging.getLogger('agent_world')
    logger.setLevel(logging.INFO)
    
    # Add a console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)
    
    # Suppress logs from other modules
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    logging.getLogger('dash').setLevel(logging.ERROR)
    logging.getLogger('flask').setLevel(logging.ERROR)
    
    logger.info('Logging initialized')
    
    return logger
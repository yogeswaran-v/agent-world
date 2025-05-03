# Agent's World

A 3D simulation of autonomous AI agents interacting in a virtual environment. This project demonstrates the integration of large language models with agent-based simulation techniques, allowing virtual agents to think, move, and converse in a shared world.

![Agent's World Screenshot](https://via.placeholder.com/800x450.png?text=Agent's+World+Simulation)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker Installation](#docker-installation)
  - [Manual Installation](#manual-installation)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Development](#development)
  - [Backend Development](#backend-development)
  - [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Introduction

Agent's World is a simulation platform where AI-driven agents navigate a virtual environment, make decisions, and interact with each other. Each agent has:

- A unique personality and goals
- The ability to think about their environment
- Memory of past events
- The capability to converse with other agents

The simulation combines agent-based modeling with language model capabilities, creating emergent behavior and interactions between autonomous entities. This project serves as both a demonstration of AI agent capabilities and a foundation for more complex simulations.

## Features

- **3D Visualization**: Explore the world in 3D with terrain features
- **Real-time Simulation**: Watch agents move, think, and interact in real-time
- **Agent Controls**: Adjust the number of agents and simulation speed
- **Agent Details**: View agents' memories, current thoughts, and conversations
- **LLM Integration**: Agents use language models for thinking and conversation
- **Websocket Communication**: Real-time updates between frontend and backend

## Technologies Used

### Backend
- **FastAPI**: High-performance API framework
- **Pydantic**: Data validation and settings management
- **WebSockets**: Real-time communication
- **OpenAI API Client**: Integration with language models

### Frontend
- **Next.js**: React framework for web applications
- **React**: UI component library
- **Three.js**: 3D visualization
- **TailwindCSS**: Utility-first CSS framework

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Ollama**: Local language model hosting

## Project Structure

```
agent-world/
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI entry point
│   │   ├── routers/           # API endpoints
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic
│   │   └── core/              # Core functionality
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                  # Next.js frontend
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   ├── world/             # World visualization
│   │   ├── controls/          # Control components
│   │   └── info/              # Information displays
│   ├── pages/                 # Next.js pages
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and constants
│   ├── styles/                # CSS styles
│   ├── public/                # Static files
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml         # Docker configuration
```

## Prerequisites

- **Docker and Docker Compose** (recommended)
- **Alternatively**: 
  - Python 3.11+ for backend
  - Node.js 18+ for frontend
  - Ollama for language model support

## Installation

### Docker Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agent-world.git
   cd agent-world
   ```

2. Create a `.env` file in the root directory (optional):
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_BASE_URL=http://ollama:11434/v1
   ```

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

### Manual Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd agent-world/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_BASE_URL=http://localhost:11434/v1
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd agent-world/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
   ```

## Running the Application

### Using Docker

After installation, the application should be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Manual Running

#### Backend

1. Navigate to the backend directory with activated virtual environment
2. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend

1. Navigate to the frontend directory
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the application at http://localhost:3000

## Usage Guide

### Basic Controls

1. **Start/Stop Simulation**: Click the Start/Pause button to control the simulation
2. **Reset**: Click Reset to clear all agents and create new ones
3. **Number of Agents**: Adjust the slider to change how many agents are in the world
4. **Simulation Speed**: Adjust the slider to change how fast agents move and think

### Interacting with Agents

1. **Select an Agent**: Click on an agent in the 3D world or use the dropdown menu
2. **View Memory**: The agent's memories appear in the Memory panel
3. **Current Thought**: See what the agent is currently thinking
4. **Conversations**: Read conversations between agents

### 3D Navigation

1. **Rotate**: Click and drag to rotate the camera
2. **Zoom**: Use the mouse wheel to zoom in and out
3. **Pan**: Right-click and drag to move the camera

## API Documentation

The backend API documentation is available at `http://localhost:8000/docs` when the backend is running.

Key endpoints:

- `GET /api/agents`: Get all agents
- `GET /api/agents/{agent_id}`: Get a specific agent
- `POST /api/agents/reset`: Reset the simulation
- `POST /api/agents/start`: Start the simulation
- `POST /api/agents/stop`: Stop the simulation
- `GET /api/agents/conversations`: Get all conversations
- `WebSocket /ws`: Real-time updates connection

## Development

### Backend Development

The backend follows a service-oriented architecture:

- **Routers**: Define API endpoints and handle HTTP requests
- **Services**: Contain business logic for agents, conversations, and thinking
- **Models**: Define data structures and validation
- **Core**: Configure application settings and logging

To add a new feature:
1. Define models in `app/models/`
2. Implement business logic in `app/services/`
3. Create API endpoints in `app/routers/`

### Frontend Development

The frontend uses component-based architecture with React:

- **Components**: Reusable UI elements
- **Hooks**: Custom logic for data fetching and state management
- **Pages**: Next.js page components
- **Lib**: Utilities and constants

To add a new feature:
1. Create new components in `components/`
2. Add hooks for data management if needed
3. Update pages to include new components

## Testing

### Backend Testing

Run the tests from the backend directory:

```bash
pytest
```

### Frontend Testing

Run the tests from the frontend directory:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with FastAPI, Next.js, and Three.js
- Agent simulation inspired by agent-based modeling techniques
- Uses Ollama for local language model integration

---

**Note**: This project is for educational and demonstration purposes. The agents' thinking and conversation capabilities are simulated and do not represent true artificial general intelligence.
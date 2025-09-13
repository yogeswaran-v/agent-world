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
- **Podman**: Rootless containerization (preferred over Docker)
- **Ollama**: Local LLM hosting (llama3.2:1b model)
- **GitHub Codespaces**: Cloud development environment support
- **WebSocket**: Real-time frontend-backend communication

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

- **Podman** (recommended) or **Docker**
- **GitHub CLI** (if running in GitHub Codespaces)
- **Alternatively for manual setup**: 
  - Python 3.11+ for backend
  - Node.js 18+ for frontend
  - Ollama for language model support

## Quick Start

### 🚀 One-Command Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yogeswaran-v/agent-world.git
   cd agent-world
   ```

2. **Start the application:**
   ```bash
   ./start-app.sh
   ```
   
   This will:
   - Build all containers (backend, frontend, Ollama)
   - Download the AI model (llama3.2:1b)
   - Start all services
   - Make ports public (if in Codespaces)
   - Display service URLs

3. **Access the application:**
   - **Frontend**: https://YOUR_CODESPACE-3000.app.github.dev (in Codespaces) or http://localhost:3000 (local)
   - **Backend**: https://YOUR_CODESPACE-8000.app.github.dev (in Codespaces) or http://localhost:8000 (local)

### ⚡ Development Workflow

After initial setup, use these commands for faster development:

```bash
# Quick restart after code changes (10-15 seconds)
./restart-app.sh

# Stop all services
./stop-app.sh

# Force rebuild (after dependency changes)
./start-app.sh --rebuild
```

## Installation Methods

### Method 1: Automated Setup (Recommended)

Use the provided scripts for the fastest setup experience:

```bash
# Full setup with build
./start-app.sh

# Quick restart for development
./restart-app.sh

# Stop and cleanup
./stop-app.sh
```

**Available script options:**
- `./start-app.sh` - Full build and start (default)
- `./start-app.sh --restart` - Quick restart without rebuilding
- `./start-app.sh --no-build` - Start without rebuilding
- `./start-app.sh --rebuild` - Force rebuild containers

### Method 2: Manual Container Setup

### Method 2: Manual Container Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yogeswaran-v/agent-world.git
   cd agent-world
   ```

2. **Create the network:**
   ```bash
   podman network create agent-network
   ```

3. **Build and run containers:**
   ```bash
   # Backend
   podman build -t agent-world-backend:latest -f backend/Containerfile ./backend
   podman run -d --name backend --network agent-network -p 8000:8000 agent-world-backend:latest

   # Frontend  
   podman build -t agent-world-frontend:latest -f frontend/Containerfile ./frontend
   podman run -d --name frontend --network agent-network -p 3000:3000 agent-world-frontend:latest

   # Ollama (AI model service)
   podman run -d --name ollama --network agent-network -p 11434:11434 docker.io/ollama/ollama:latest
   
   # Download the AI model
   podman exec ollama ollama pull llama3.2:1b
   ```

4. **Make ports public (Codespaces only):**
   ```bash
   gh codespace ports visibility 3000:public 8000:public 11434:public --codespace $CODESPACE_NAME
   ```

### Method 3: Local Development Setup

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

### 🎯 Quick Access URLs

After running `./start-app.sh`, your application will be available at:

**GitHub Codespaces:**
- **Frontend**: `https://YOUR_CODESPACE-3000.app.github.dev/`
- **Backend API**: `https://YOUR_CODESPACE-8000.app.github.dev/`
- **API Docs**: `https://YOUR_CODESPACE-8000.app.github.dev/docs`
- **Ollama**: `https://YOUR_CODESPACE-11434.app.github.dev/`

**Local Development:**
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **Ollama**: `http://localhost:11434`

### 🔧 Development Commands

```bash
# Start everything (first time or after major changes)
./start-app.sh

# Quick restart during development (much faster!)
./restart-app.sh

# Stop all services
./stop-app.sh

# View logs
podman logs backend
podman logs frontend
podman logs ollama

# Check container status
podman ps
```

### 🚨 Troubleshooting

**"Disconnected" status in UI:**
- Ensure ports are public in Codespaces: `gh codespace ports visibility 3000:public 8000:public 11434:public`
- Check if all containers are running: `podman ps`

**Containers not starting:**
- Clean up and restart: `./stop-app.sh && ./start-app.sh`

**Port conflicts:**
- Stop existing containers: `./stop-app.sh`

### 🛠️ Advanced Development

**Backend Development:**
- **Service Architecture**: Agents, conversations, and thinking services
- **WebSocket Integration**: Real-time communication with frontend
- **AI Integration**: Ollama client for local LLM inference
- **Configuration**: Environment-based settings with Pydantic

**Frontend Development:**
- **Component Architecture**: Modular React components
- **3D Visualization**: Three.js integration for world rendering
- **Real-time Updates**: WebSocket hooks for live data
- **Responsive Design**: TailwindCSS for styling

**Adding New Features:**
1. **Backend**: Add service logic, update routers, extend models
2. **Frontend**: Create components, add hooks, update UI
3. **Integration**: Update WebSocket events, test end-to-end
4. **Testing**: Use `./restart-app.sh` for quick iteration

### 🧪 Testing

```bash
# Test API endpoints
curl https://YOUR_CODESPACE-8000.app.github.dev/api/agents/

# Test WebSocket connection (in browser console)
const ws = new WebSocket('wss://YOUR_CODESPACE-8000.app.github.dev/ws');

# Check AI model
podman exec ollama ollama list
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test with `./restart-app.sh`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Use the provided scripts for consistent environment setup
- Test changes with `./restart-app.sh` before committing
- Follow the existing code structure and patterns
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **FastAPI** - High-performance Python web framework
- **Next.js** - React framework for production
- **Three.js** - 3D graphics library
- **Ollama** - Local LLM hosting
- **TailwindCSS** - Utility-first CSS framework
- **Llama 3.2** - Meta's language model

## 📊 Performance Notes

- **First startup**: 2-3 minutes (builds containers + downloads AI model)
- **Development restarts**: 10-15 seconds with `./restart-app.sh`
- **AI inference**: Fast local inference with 1B parameter model
- **Memory usage**: ~2-4GB total (containers + AI model)

---

**Built with ❤️ for AI agent simulation and research**

## Usage Guide

### 🎮 Getting Started

1. **Start the application** using `./start-app.sh`
2. **Open the frontend** in your browser
3. **Wait for "Connected" status** in the top-left corner
4. **Click "Start"** to begin the simulation

### 🎛️ Controls

**Simulation Controls:**
- **Start/Pause**: Control simulation execution
- **Reset**: Create new agents with random personalities
- **Agent Count**: Adjust number of agents (1-100)
- **Speed**: Control simulation speed (100ms - 5000ms intervals)

**Agent Selection:**
- **Click agents** in the 3D world to select them
- **Use dropdown** to select specific agents
- **View details** in the right panels

### 🤖 AI Features

**Agent Intelligence:**
- **Personalities**: Each agent has unique traits (curious, analytical, social, etc.)
- **Goals**: Agents pursue individual objectives (explore, socialize, find optimal locations)
- **Thinking**: Agents use AI to reason about their environment
- **Memory**: Agents remember past events and interactions
- **Conversations**: Agents can talk to nearby agents using natural language

**AI Model:**
- **Model**: Llama 3.2 1B (lightweight, fast inference)
- **Local hosting**: Runs entirely offline via Ollama
- **No API keys**: No external AI service required

### 🌍 3D World Navigation

**Camera Controls:**
- **Rotate**: Left-click and drag
- **Zoom**: Mouse wheel
- **Pan**: Right-click and drag

**Environment:**
- **Terrain features**: Lake, mountains, open areas
- **Agent visualization**: Colored spheres with movement trails
- **Real-time updates**: Smooth agent movement and state changes

## GitHub Codespaces

This project is optimized for GitHub Codespaces development:

### 🚀 One-Click Setup

1. **Open in Codespaces**: Click "Code" → "Codespaces" → "Create codespace"
2. **Wait for setup**: The environment will automatically configure
3. **Run the app**: Execute `./start-app.sh` in the terminal
4. **Access via browser**: Click the forwarded port links

### ✨ Codespaces Features

- **Pre-configured environment**: All dependencies included
- **Automatic port forwarding**: Frontend, backend, and AI service accessible
- **Public URLs**: Share your simulation with others
- **Resource management**: Scripts include Codespace-specific optimizations
- **No local setup**: Everything runs in the cloud

### 🔧 Codespace-Specific Commands

```bash
# Make ports public (handled automatically by scripts)
gh codespace ports visibility 3000:public 8000:public 11434:public

# Check codespace environment
echo $CODESPACE_NAME

# Access URLs
echo "Frontend: https://$CODESPACE_NAME-3000.app.github.dev"
echo "Backend: https://$CODESPACE_NAME-8000.app.github.dev"
```

## API Documentation

The backend API documentation is available at `/docs` endpoint when the backend is running:
- **Codespaces**: `https://YOUR_CODESPACE-8000.app.github.dev/docs`
- **Local**: `http://localhost:8000/docs`

### Key Endpoints

- `GET /api/agents/` - Get all agents with their current state
- `GET /api/agents/{agent_id}` - Get specific agent details
- `POST /api/agents/reset` - Reset simulation with new agents
- `POST /api/agents/start` - Start the simulation
- `WebSocket /ws` - Real-time updates and communication

### WebSocket Events

The WebSocket connection provides real-time updates:
- `agent_update` - Agent positions and state changes
- `conversation_update` - New conversations between agents
- `simulation_started` - Simulation state changes
- `simulation_stopped` - Simulation state changes

## Development

### 📁 Project Structure

```
agent-world/
├── 🚀 Quick Start Scripts
│   ├── start-app.sh           # Full setup and start
│   ├── restart-app.sh         # Quick development restart
│   └── stop-app.sh           # Stop and cleanup
│
├── 🔧 Backend (FastAPI)
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Data models
│   │   └── core/             # Configuration
│   └── Containerfile         # Container build
│
├── 🎨 Frontend (Next.js)
│   ├── components/           # React components
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Next.js pages
│   └── Containerfile        # Container build
│
└── 📚 Documentation
    ├── README.md            # This file
    └── DEVELOPMENT.md       # Development workflow
```

### 🔄 Development Workflow

**Recommended workflow for active development:**

1. **Initial setup** (once):
   ```bash
   ./start-app.sh
   ```

2. **Daily development** (after code changes):
   ```bash
   ./restart-app.sh
   ```

3. **When adding dependencies**:
   ```bash
   ./start-app.sh --rebuild
   ```

4. **End of session**:
   ```bash
   ./stop-app.sh
   ```

### 🛠️ Advanced Development
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
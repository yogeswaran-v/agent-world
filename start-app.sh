#!/bin/bash

# Agent World Application Startup Script
# This script sets up and starts all containers for the agent-world application

# Usage:
# ./start-app.sh              # Full build and start (default)
# ./start-app.sh --rebuild     # Force rebuild containers
# ./start-app.sh --restart     # Quick restart without rebuilding (if containers exist)
# ./start-app.sh --no-build    # Start without rebuilding

# Make sure start-app.sh has execute permissions
# chmod +x start-app.sh

set -e  # Exit on any error

# Parse command line arguments
REBUILD=true
RESTART_ONLY=false

for arg in "$@"; do
    case $arg in
        --rebuild)
            REBUILD=true
            ;;
        --restart|--no-build)
            REBUILD=false
            RESTART_ONLY=true
            ;;
        --no-build)
            REBUILD=false
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--rebuild|--restart|--no-build]"
            exit 1
            ;;
    esac
done

if [ "$RESTART_ONLY" = true ]; then
    # Quick restart mode - just restart existing containers
    echo "🔄 Quick restarting Agent World Application..."
    
    # Check if containers exist
    if ! (podman container exists backend && podman container exists frontend && podman container exists ollama) 2>/dev/null; then
        echo "❌ Containers don't exist yet. Running full build..."
        REBUILD=true
        RESTART_ONLY=false
    else
        echo "🔄 Restarting existing containers..."
        podman restart backend frontend ollama
        
        # Wait a moment for services to start
        echo "⏳ Waiting for services to initialize..."
        sleep 5
        
        # Skip to status check
        echo "📊 Service Status:"
        podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Make ports public in Codespaces if running in Codespaces environment
        if [ -n "$CODESPACE_NAME" ]; then
            echo "🌐 Ensuring ports are public in Codespaces..."
            gh codespace ports visibility 3000:public 8000:public 11434:public --codespace "$CODESPACE_NAME" 2>/dev/null || echo "Port visibility already set or command failed"
        fi
        
        # Test connectivity and exit
        echo "🔍 Testing service connectivity..."
        echo "Backend: $(curl -s http://localhost:8000/api/agents/ 2>/dev/null | grep -o '"name":' | wc -l || echo '0') agents loaded"
        echo "Ollama: $(curl -s http://localhost:11434 2>/dev/null || echo 'Not ready yet')"
        echo "Model: $(podman exec ollama ollama list 2>/dev/null | grep llama3.2:1b | cut -d' ' -f1 || echo 'Model not found')"
        
        echo ""
        echo "✅ Agent World Application restarted successfully!"
        echo "🌐 Frontend: https://$CODESPACE_NAME-3000.app.github.dev/"
        echo "🔧 Backend: https://$CODESPACE_NAME-8000.app.github.dev/"
        echo "🤖 Ollama: https://$CODESPACE_NAME-11434.app.github.dev/"
        echo ""
        echo "📝 To view logs:"
        echo "   podman logs backend"
        echo "   podman logs frontend" 
        echo "   podman logs ollama"
        echo ""
        echo "🛑 To stop all services, run: ./stop-app.sh"
        exit 0
    fi
fi

echo "🚀 Starting Agent World Application..."

# Create the network
echo "📡 Creating agent-network..."
podman network create agent-network 2>/dev/null || echo "Network already exists"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
podman stop backend frontend ollama 2>/dev/null || true
podman rm backend frontend ollama 2>/dev/null || true

# Build and run the backend
if [ "$REBUILD" = true ]; then
    echo "🔧 Building backend..."
    podman build -t localhost/agent-world-backend:latest -f backend/Containerfile ./backend
else
    echo "⚡ Skipping backend build..."
fi

echo "▶️  Starting backend..."
podman run -d --name backend --network agent-network -p 8000:8000 localhost/agent-world-backend:latest

# Build and run the frontend
if [ "$REBUILD" = true ]; then
    echo "🔧 Building frontend..."
    podman build -t localhost/agent-world-frontend:latest -f frontend/Containerfile ./frontend
else
    echo "⚡ Skipping frontend build..."
fi

echo "▶️  Starting frontend..."
podman run -d --name frontend --network agent-network -p 3000:3000 localhost/agent-world-frontend:latest

# Pull and run Ollama
echo "🤖 Starting Ollama LLM service..."
podman pull docker.io/ollama/ollama:latest 2>/dev/null || true
podman run -d --name ollama --network agent-network -p 11434:11434 docker.io/ollama/ollama:latest

# Wait for Ollama to start, then pull the required model
echo "⏳ Waiting for Ollama to initialize..."
sleep 10

echo "📦 Pulling llama3.2:1b model for agent intelligence..."
podman exec ollama ollama pull llama3.2:1b

echo "⏳ Waiting for all services to fully initialize..."
sleep 5

# Check status
echo "📊 Service Status:"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Make ports public in Codespaces if running in Codespaces environment
if [ -n "$CODESPACE_NAME" ]; then
    echo "🌐 Making ports public in Codespaces..."
    gh codespace ports visibility 3000:public 8000:public 11434:public --codespace "$CODESPACE_NAME" 2>/dev/null || echo "Port visibility already set or command failed"
fi

# Test connectivity
echo "🔍 Testing service connectivity..."
echo "Backend: $(curl -s http://localhost:8000/api/agents/ 2>/dev/null | grep -o '"name":' | wc -l || echo '0') agents loaded"
echo "Ollama: $(curl -s http://localhost:11434 2>/dev/null || echo 'Not ready yet')"
echo "Model: $(podman exec ollama ollama list 2>/dev/null | grep llama3.2:1b | cut -d' ' -f1 || echo 'Model not found')"

echo ""
echo "✅ Agent World Application is starting up!"
echo "🌐 Frontend: https://$CODESPACE_NAME-3000.app.github.dev/"
echo "🔧 Backend: https://$CODESPACE_NAME-8000.app.github.dev/"
echo "🤖 Ollama: https://$CODESPACE_NAME-11434.app.github.dev/"
echo ""
echo "📝 To view logs:"
echo "   podman logs backend"
echo "   podman logs frontend" 
echo "   podman logs ollama"
echo ""
echo "🛑 To stop all services, run: ./stop-app.sh"
echo "🔄 For quick restart without rebuild: ./start-app.sh --restart"
echo "⚡ For quick restart script: ./restart-app.sh"

# Optionally open the frontend in browser
read -p "🌐 Open frontend in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$BROWSER" "https://$CODESPACE_NAME-3000.app.github.dev/"
fi
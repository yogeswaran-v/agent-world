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
FORCE_MODEL_DOWNLOAD=false

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
        --force-models)
            FORCE_MODEL_DOWNLOAD=true
            echo "🔄 Force model download enabled - will re-download models even if they exist"
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--rebuild|--restart|--no-build|--force-models]"
            echo "  --rebuild      Force rebuild containers"
            echo "  --restart      Quick restart without rebuilding"
            echo "  --no-build     Start without rebuilding"  
            echo "  --force-models Force re-download models even if cached"
            exit 1
            ;;
    esac
done

if [ "$RESTART_ONLY" = true ]; then
    # Quick restart mode - just restart existing containers
    echo "🔄 Quick restarting Agent World Application..."
    
    # Check if containers exist
    if ! (podman container exists backend && podman container exists frontend && podman container exists ollama && podman container exists ollama2 && podman container exists ollama3) 2>/dev/null; then
        echo "❌ Containers don't exist yet. Running full build..."
        REBUILD=true
        RESTART_ONLY=false
    else
        echo "🔄 Restarting existing containers..."
        podman restart backend frontend ollama ollama2 ollama3
        
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
        echo "Ollama 1: $(curl -s http://localhost:11434 2>/dev/null || echo 'Not ready yet')"
        echo "Ollama 2: $(curl -s http://localhost:11435 2>/dev/null || echo 'Not ready yet')"
        echo "Ollama 3: $(curl -s http://localhost:11436 2>/dev/null || echo 'Not ready yet')"
        echo "Models: $(podman exec ollama ollama list 2>/dev/null | grep llama3.2:1b | cut -d' ' -f1 || echo 'Not found')"
        
        echo ""
        echo "✅ Agent World Application restarted successfully!"
        echo "🌐 Frontend: https://$CODESPACE_NAME-3000.app.github.dev/"
        echo "🔧 Backend: https://$CODESPACE_NAME-8000.app.github.dev/"
        echo "🤖 Ollama 1: https://$CODESPACE_NAME-11434.app.github.dev/"
        echo "🤖 Ollama 2: https://$CODESPACE_NAME-11435.app.github.dev/"
        echo "🤖 Ollama 3: https://$CODESPACE_NAME-11436.app.github.dev/"
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

# Show existing volumes to indicate if models are already downloaded
echo "📊 Checking existing resources..."
existing_volumes=$(podman volume ls --format "{{.Name}}" | grep -E "ollama_data|ollama_data2|ollama_data3" | wc -l)
if [ "$existing_volumes" -gt 0 ]; then
    echo "✅ Found $existing_volumes existing Ollama volumes - models may already be cached"
else
    echo "🆕 No existing volumes found - fresh installation"
fi

# Create the network
echo "📡 Creating agent-network..."
podman network create agent-network 2>/dev/null || echo "Network already exists"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
podman stop backend frontend ollama ollama2 ollama3 2>/dev/null || true
podman rm backend frontend ollama ollama2 ollama3 2>/dev/null || true

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

# Pull and run multiple Ollama instances for parallel processing
echo "🤖 Starting Multi-LLM Architecture (3 Ollama services)..."
podman pull docker.io/ollama/ollama:latest 2>/dev/null || true

# Create persistent volumes for model storage (only if they don't exist)
echo "📁 Ensuring persistent volumes for model storage..."
podman volume create ollama_data 2>/dev/null || echo "Volume ollama_data already exists"
podman volume create ollama_data2 2>/dev/null || echo "Volume ollama_data2 already exists"  
podman volume create ollama_data3 2>/dev/null || echo "Volume ollama_data3 already exists"

# Start 3 Ollama instances for independent agent processing
echo "▶️  Starting Ollama instance 1 (port 11434)..."
podman run -d --name ollama --network agent-network -p 11434:11434 -v ollama_data:/root/.ollama --memory=2g docker.io/ollama/ollama:latest

echo "▶️  Starting Ollama instance 2 (port 11435)..."
podman run -d --name ollama2 --network agent-network -p 11435:11434 -v ollama_data2:/root/.ollama --memory=2g docker.io/ollama/ollama:latest

echo "▶️  Starting Ollama instance 3 (port 11436)..."
podman run -d --name ollama3 --network agent-network -p 11436:11434 -v ollama_data3:/root/.ollama --memory=2g docker.io/ollama/ollama:latest

# Wait for all Ollama instances to start
echo "⏳ Waiting for all Ollama instances to initialize..."
sleep 15

echo "📦 Checking and pulling llama3.2:1b model to LLM services (only if needed)..."
model_start_time=$(date +%s)

# Function to check and pull model if needed
check_and_pull_model() {
    local container_name=$1
    local service_num=$2
    
    if [ "$FORCE_MODEL_DOWNLOAD" = true ]; then
        echo "🔄 Force downloading llama3.2:1b to $container_name (Service $service_num)..."
        podman exec $container_name ollama pull llama3.2:1b
    elif podman exec $container_name ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        echo "✅ Model llama3.2:1b already exists in $container_name"
    else
        echo "📥 Downloading llama3.2:1b to $container_name (Service $service_num)..."
        podman exec $container_name ollama pull llama3.2:1b
    fi
}

# Check and pull models in parallel only if needed
check_and_pull_model "ollama" "1" &
check_and_pull_model "ollama2" "2" &  
check_and_pull_model "ollama3" "3" &
wait  # Wait for all model checks/pulls to complete

model_end_time=$(date +%s)
model_duration=$((model_end_time - model_start_time))
echo "⏱️  Model setup completed in ${model_duration} seconds"

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
echo "Ollama 1: $(curl -s http://localhost:11434 2>/dev/null || echo 'Not ready yet')"
echo "Ollama 2: $(curl -s http://localhost:11435 2>/dev/null || echo 'Not ready yet')"  
echo "Ollama 3: $(curl -s http://localhost:11436 2>/dev/null || echo 'Not ready yet')"
echo "Models: $(podman exec ollama ollama list 2>/dev/null | grep llama3.2:1b | cut -d' ' -f1 || echo 'Not found')"

echo ""
echo "✅ Agent World Application with Multi-LLM Architecture is starting up!"
echo "🌐 Frontend: https://$CODESPACE_NAME-3000.app.github.dev/"
echo "🔧 Backend: https://$CODESPACE_NAME-8000.app.github.dev/"
echo "🤖 Ollama 1: https://$CODESPACE_NAME-11434.app.github.dev/"
echo "🤖 Ollama 2: https://$CODESPACE_NAME-11435.app.github.dev/"
echo "🤖 Ollama 3: https://$CODESPACE_NAME-11436.app.github.dev/"
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
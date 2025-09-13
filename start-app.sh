#!/bin/bash

# Agent World Application Startup Script
# This script sets up and starts all containers for the agent-world application

# Ensure stop-app.sh is executable and run it to clean up any existing containers

# Make sure start-app.sh has execute permissions
# chmod +x start-app.sh

# Run the below command in terminal to start the application
# ./start-app.sh

set -e  # Exit on any error

echo "🚀 Starting Agent World Application..."

# Create the network
echo "📡 Creating agent-network..."
podman network create agent-network 2>/dev/null || echo "Network already exists"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
podman stop backend frontend ollama 2>/dev/null || true
podman rm backend frontend ollama 2>/dev/null || true

# Build and run the backend
echo "🔧 Building backend..."
podman build -t localhost/agent-world-backend:latest -f backend/Containerfile ./backend

echo "▶️  Starting backend..."
podman run -d --name backend --network agent-network -p 8000:8000 localhost/agent-world-backend:latest

# Build and run the frontend
echo "🔧 Building frontend..."
podman build -t localhost/agent-world-frontend:latest -f frontend/Containerfile ./frontend

echo "▶️  Starting frontend..."
podman run -d --name frontend --network agent-network -p 3000:3000 localhost/agent-world-frontend:latest

# Pull and run Ollama
echo "🤖 Starting Ollama LLM service..."
podman pull docker.io/ollama/ollama:latest 2>/dev/null || true
podman run -d --name ollama --network agent-network -p 11434:11434 docker.io/ollama/ollama:latest

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check status
echo "📊 Service Status:"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test connectivity
echo "🔍 Testing service connectivity..."
echo "Backend: $(curl -s http://localhost:8000/health 2>/dev/null || echo 'Not ready yet')"
echo "Ollama: $(curl -s http://localhost:11434 2>/dev/null || echo 'Not ready yet')"

echo ""
echo "✅ Agent World Application is starting up!"
echo "🌐 Frontend: https://improved-journey-659q7vpgjr2457v-3000.app.github.dev/"
echo "🔧 Backend: https://improved-journey-659q7vpgjr2457v-8000.app.github.dev/"
echo "🤖 Ollama: https://improved-journey-659q7vpgjr2457v-11434.app.github.dev/"
echo ""
echo "📝 To view logs:"
echo "   podman logs backend"
echo "   podman logs frontend" 
echo "   podman logs ollama"
echo ""
echo "🛑 To stop all services, run: ./stop-app.sh"

# Optionally open the frontend in browser
read -p "🌐 Open frontend in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$BROWSER" "https://improved-journey-659q7vpgjr2457v-3000.app.github.dev/"
fi
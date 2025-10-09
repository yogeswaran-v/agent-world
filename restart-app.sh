#!/bin/bash

# Agent World Application Quick Restart Script
# This script quickly restarts containers without rebuilding for faster development

set -e  # Exit on any error

echo "🔄 Quick restarting Agent World Application..."

# Check if containers exist before trying to restart
if ! (podman container exists backend && podman container exists frontend && podman container exists ollama && podman container exists ollama2 && podman container exists ollama3) 2>/dev/null; then
    echo "❌ Containers don't exist yet. Please run ./start-app.sh first to build and create containers."
    exit 1
fi

# Restart existing containers
echo "🔄 Restarting backend..."
podman restart backend

echo "🔄 Restarting frontend..."
podman restart frontend

echo "🔄 Restarting ollama instances..."
podman restart ollama ollama2 ollama3

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check status
echo "📊 Service Status:"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Make ports public in Codespaces if running in Codespaces environment
if [ -n "$CODESPACE_NAME" ]; then
    echo "🌐 Ensuring ports are public in Codespaces..."
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
echo "✅ Agent World Multi-LLM Application restarted successfully!"
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
echo "🔧 For development with auto-rebuild: ./start-app.sh --rebuild"
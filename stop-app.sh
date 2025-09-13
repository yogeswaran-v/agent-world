#!/bin/bash

# Agent World Application Stop Script
# This script stops all running containers and cleans up resources

# Make sure stop-app.sh has execute permissions
# chmod +x stop-app.sh

# Run the below command in terminal to stop the application
# ./stop-app.sh

echo "🛑 Stopping Agent World Application..."

# Stop all containers
echo "⏹️  Stopping containers..."
podman stop backend frontend ollama 2>/dev/null || echo "Some containers were already stopped"

# Remove containers
echo "🗑️  Removing containers..."
podman rm backend frontend ollama 2>/dev/null || echo "Some containers were already removed"

# Optional: Clean up images and network (uncomment if you want full cleanup)
read -p "🧹 Remove images and network to save space? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing images..."
    podman rmi localhost/agent-world-backend:latest localhost/agent-world-frontend:latest docker.io/ollama/ollama:latest 2>/dev/null || true
    
    echo "🌐 Removing network..."
    podman network rm agent-network 2>/dev/null || true
    
    echo "🧽 Running system cleanup..."
    podman system prune -a -f
    
    echo "💾 Disk space reclaimed!"
else
    echo "📦 Images and network preserved for faster restart"
fi

# Show final status
echo ""
echo "📊 Final Status:"
echo "Running containers: $(podman ps --format 'table {{.Names}}' | wc -l)"
echo "Total images: $(podman images --format 'table {{.Repository}}' | wc -l)"

echo ""
echo "✅ Agent World Application stopped successfully!"
echo "🚀 To restart, run: ./start-app.sh"
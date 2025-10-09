#!/bin/bash

# Demo script to show intelligent model caching benefits

echo "🧪 Agent World - Intelligent Model Caching Demo"
echo "================================================="
echo ""

# Check current model status
echo "📊 Current Model Status:"
echo ""

check_model_status() {
    local container_name=$1
    local service_num=$2
    
    if podman exec $container_name ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        echo "✅ Service $service_num ($container_name): Model cached (1.3GB) - ⚡ INSTANT"
    else
        echo "❌ Service $service_num ($container_name): Model missing - 📥 NEEDS DOWNLOAD (~2-3 min)"
    fi
}

check_model_status "ollama" "1"
check_model_status "ollama2" "2"  
check_model_status "ollama3" "3"

echo ""
echo "💡 Benefits of Intelligent Caching:"
echo "   ✅ No unnecessary downloads"
echo "   ✅ Faster startup times"
echo "   ✅ Reduced bandwidth usage"
echo "   ✅ Persistent model storage"
echo ""

# Calculate potential time savings
cached1=$(podman exec ollama ollama list 2>/dev/null | grep -c "llama3.2:1b" || echo "0")
cached2=$(podman exec ollama2 ollama list 2>/dev/null | grep -c "llama3.2:1b" || echo "0")
cached3=$(podman exec ollama3 ollama list 2>/dev/null | grep -c "llama3.2:1b" || echo "0")
cached_models=$((cached1 + cached2 + cached3))

total_models=3
missing_models=$((total_models - cached_models))

echo "📈 Performance Impact:"
echo "   • Models cached: $cached_models/3"
echo "   • Models to download: $missing_models/3"
echo "   • Data saved: $(($cached_models * 1))GB (approx)"
echo "   • Time saved: ~$(($cached_models * 2)) minutes"
echo ""

if [ $missing_models -eq 0 ]; then
    echo "🚀 All models cached! Next startup will be lightning fast!"
else
    echo "⏳ $missing_models models need downloading on next full restart"
fi

echo ""
echo "🛠️  Usage:"
echo "   ./start-app.sh --restart     # Use existing containers & models"
echo "   ./start-app.sh --force-models # Force re-download all models"
echo "   ./start-app.sh               # Smart caching (default)"
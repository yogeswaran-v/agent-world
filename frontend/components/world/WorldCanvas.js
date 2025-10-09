import { useRef, useEffect, useCallback, useState } from 'react';

// Helper function to convert color names to CSS colors
const colorNameToCSS = {
  red: '#ff4444',
  green: '#44ff44',
  blue: '#4444ff',
  yellow: '#ffff44',
  cyan: '#44ffff',
  magenta: '#ff44ff',
  purple: '#aa44aa',
  orange: '#ffaa44',
  pink: '#ffaacc',
  teal: '#44aaaa',
};

// Isometric projection helper
const isoProject = (x, y, z = 0) => {
  const scale = 1.2; // Increased scale for better viewport usage
  const isoX = (x - y) * Math.cos(Math.PI / 6) * scale;
  const isoY = (x + y) * Math.sin(Math.PI / 6) * scale - z * scale;
  return { x: isoX, y: isoY };
};

// World bounds
const WORLD_BOUNDS = {
  minX: 50,
  maxX: 450,
  minY: 50,
  maxY: 450
};

// Draw terrain features
const drawTerrain = (ctx, time, canvasWidth, canvasHeight, cameraOffset = { x: 0, y: 0 }, zoom = 1) => {
  // Better centering - offset the world to use more space
  const centerX = canvasWidth / 2 + cameraOffset.x;
  const centerY = canvasHeight / 2 - 20 + cameraOffset.y;  // Draw lake
  const lakeCenter = isoProject(150, 150);
  const lakeX = (lakeCenter.x * zoom) + centerX;
  const lakeY = (lakeCenter.y * zoom) + centerY;
  
  ctx.save();
  ctx.translate(lakeX, lakeY);
  
  // Animated water
  const ripple = Math.sin(time * 0.002) * 2;
  ctx.fillStyle = '#0077be';
  ctx.beginPath();
  ctx.ellipse(0, 0, (40 + ripple) * zoom, (25 + ripple * 0.5) * zoom, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Water shine
  ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-10 * zoom, -8 * zoom, (15 + ripple * 0.5) * zoom, (8 + ripple * 0.3) * zoom, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw mountains
  const mountains = [
    { x: 320, y: 240, height: 35 },
    { x: 350, y: 280, height: 40 },
    { x: 380, y: 250, height: 32 }
  ];
  
  mountains.forEach(mountain => {
    const pos = isoProject(mountain.x, mountain.y);
    const screenX = (pos.x * zoom) + centerX;
    const screenY = (pos.y * zoom) + centerY;
    
    // Mountain body
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - (mountain.height * zoom));
    ctx.lineTo(screenX - (20 * zoom), screenY);
    ctx.lineTo(screenX + (20 * zoom), screenY);
    ctx.closePath();
    ctx.fill();
    
    // Snow cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - (mountain.height * zoom));
    ctx.lineTo(screenX - (8 * zoom), screenY - (mountain.height * 0.7 * zoom));
    ctx.lineTo(screenX + (8 * zoom), screenY - (mountain.height * 0.7 * zoom));
    ctx.closePath();
    ctx.fill();
  });
  
  // Draw trees within world bounds
  const treePositions = [
    [180, 160], [200, 180], [220, 150], [190, 200], [210, 220],
    [240, 170], [260, 190], [280, 160], [300, 180], [320, 150]
  ];
  
  treePositions.forEach(([x, y], index) => {
    // Only draw trees within bounds
    if (x >= WORLD_BOUNDS.minX && x <= WORLD_BOUNDS.maxX && 
        y >= WORLD_BOUNDS.minY && y <= WORLD_BOUNDS.maxY) {
      const pos = isoProject(x, y);
      const screenX = (pos.x * zoom) + centerX;
      const screenY = (pos.y * zoom) + centerY;
      const sway = Math.sin(time * 0.001 + index) * (2 * zoom);
      
      // Tree trunk
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(screenX - (2 * zoom), screenY - (5 * zoom), 4 * zoom, 15 * zoom);
      
      // Tree foliage (multiple layers for depth)
      const foliageColors = ['#228B22', '#32CD32', '#006400'];
      foliageColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX + sway, screenY - (15 + i * 3) * zoom, (12 - i * 2) * zoom, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
};

// Draw a beautiful 2.5D character
const drawCharacter = (ctx, agent, isSelected, time, canvasWidth, canvasHeight, cameraOffset = { x: 0, y: 0 }, zoom = 1) => {
  const { x, y, color, name, move_progress = 0 } = agent;
  // Better centering - offset the world to use more space
  const centerX = canvasWidth / 2 + cameraOffset.x;
  const centerY = canvasHeight / 2 - 20 + cameraOffset.y;
  
  // Smooth interpolation for movement
  const targetX = agent.target_x || x;
  const targetY = agent.target_y || y;
  const currentX = x + (targetX - x) * move_progress;
  const currentY = y + (targetY - y) * move_progress;
  
  const projected = isoProject(currentX, currentY, 0);
  const screenX = (projected.x * zoom) + centerX;
  const screenY = (projected.y * zoom) + centerY;
  
  // Walking animation
  const isMoving = move_progress > 0 && move_progress < 1;
  const walkOffset = isMoving ? time * 0.01 : 0;
  const walkBob = isMoving ? Math.sin(walkOffset) * (1.5 * zoom) : 0;
  const charY = screenY - walkBob;
  
  // Movement direction indicator
  if (isMoving) {
    const dx = targetX - x;
    const dy = targetY - y;
    const angle = Math.atan2(dy, dx);
    
    ctx.save();
    ctx.translate(screenX, charY - 25);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(0, -3);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  ctx.save();
  
  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3 * zoom;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 25 * zoom, 0, Math.PI * 2);
    ctx.stroke();
    
    // Pulsing effect
    ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + Math.sin(time * 0.005) * 0.2})`;
    ctx.lineWidth = 1 * zoom;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 30 * zoom, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Character shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + (12 * zoom), 10 * zoom, 4 * zoom, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Character body
  const bodyColor = colorNameToCSS[color] || '#888888';
  ctx.fillStyle = bodyColor;
  ctx.fillRect(screenX - (6 * zoom), charY - (8 * zoom), 12 * zoom, 16 * zoom);
  
  // Character head
  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath();
  ctx.arc(screenX, charY - (15 * zoom), 7 * zoom, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenX - (2 * zoom), charY - (16 * zoom), 1 * zoom, 0, Math.PI * 2);
  ctx.arc(screenX + (2 * zoom), charY - (16 * zoom), 1 * zoom, 0, Math.PI * 2);
  ctx.fill();
  
  // Hair/hat
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(screenX, charY - (18 * zoom), 8 * zoom, Math.PI, Math.PI * 2);
  ctx.fill();
  
  // Arms (with walking animation)
  ctx.fillStyle = '#fdbcb4';
  const armSwing = isMoving ? Math.sin(walkOffset) * 0.3 : 0;
  
  // Left arm
  ctx.save();
  ctx.translate(screenX - 8, charY - 5);
  ctx.rotate(armSwing);
  ctx.fillRect(-1, -3, 2, 8);
  ctx.restore();
  
  // Right arm  
  ctx.save();
  ctx.translate(screenX + 8, charY - 5);
  ctx.rotate(-armSwing);
  ctx.fillRect(-1, -3, 2, 8);
  ctx.restore();
  
  // Legs (with walking animation)
  const legSwing = isMoving ? Math.sin(walkOffset + Math.PI) * 0.2 : 0;
  
  // Left leg
  ctx.fillStyle = '#4169e1';
  ctx.save();
  ctx.translate(screenX - 3, charY + 5);
  ctx.rotate(legSwing);
  ctx.fillRect(-1, -3, 2, 8);
  ctx.restore();
  
  // Right leg
  ctx.save();
  ctx.translate(screenX + 3, charY + 5);
  ctx.rotate(-legSwing);
  ctx.fillRect(-1, -3, 2, 8);
  ctx.restore();
  
  // Activity indicators
  const hasThought = agent.last_thought && agent.last_thought.trim().length > 0;
  const hasMemories = agent.memory && agent.memory.length > 0;
  
  // Thinking indicator
  if (hasThought) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Gold for thinking
    ctx.beginPath();
    ctx.arc(screenX + 12, charY - 20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Pulsing effect
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(time * 0.008) * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(screenX + 12, charY - 20, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Memory indicator
  if (hasMemories) {
    ctx.fillStyle = 'rgba(135, 206, 235, 0.8)'; // Sky blue for memory
    ctx.beginPath();
    ctx.arc(screenX - 12, charY - 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Name label with beautiful styling
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.font = 'bold 12px Arial';
  const textWidth = ctx.measureText(name).width;
  ctx.fillRect(screenX - textWidth/2 - 4, charY - 35, textWidth + 8, 16);
  
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name, screenX, charY - 25);
  
  ctx.restore();
};

const WorldCanvas = ({ agents, selectedAgent, onAgentClick }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Handle mouse interactions for navigation and agent selection
  const handleMouseDown = useCallback((event) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x: mouseX - cameraOffset.x, y: mouseY - cameraOffset.y });
  }, [cameraOffset]);

  const handleMouseMove = useCallback((event) => {
    if (!canvasRef.current || !isDragging) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setCameraOffset({
      x: mouseX - dragStart.x,
      y: mouseY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback((event) => {
    if (!isDragging) {
      // Handle agent selection on click (not drag)
      if (!canvasRef.current || !agents) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const centerX = canvas.clientWidth / 2 + cameraOffset.x;
      const centerY = canvas.clientHeight / 2 - 20 + cameraOffset.y;
      
      // Find clicked agent
      const clickedAgent = agents.find(agent => {
        const projected = isoProject(agent.x, agent.y);
        const screenX = (projected.x * zoom) + centerX;
        const screenY = (projected.y * zoom) + centerY;
        
        const distance = Math.sqrt(
          (clickX - screenX) ** 2 + (clickY - screenY) ** 2
        );
        
        return distance < (20 * zoom); // Click radius adjusted for zoom
      });
      
      if (clickedAgent && onAgentClick) {
        onAgentClick(clickedAgent.id);
      }
    }
    
    setIsDragging(false);
  }, [agents, onAgentClick, isDragging, cameraOffset, zoom]);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom * zoomFactor)));
  }, []);

  // Animation and rendering loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size and enable high DPI
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
    };
    
    setupCanvas();
    
    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const time = Date.now();
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / (window.devicePixelRatio || 1));
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a subtle grid for spatial reference
      const gridCenterX = (canvas.width / (window.devicePixelRatio || 1)) / 2 + cameraOffset.x;
      const gridCenterY = (canvas.height / (window.devicePixelRatio || 1)) / 2 - 20 + cameraOffset.y;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Draw isometric grid
      for (let x = WORLD_BOUNDS.minX; x <= WORLD_BOUNDS.maxX; x += 50) {
        for (let y = WORLD_BOUNDS.minY; y <= WORLD_BOUNDS.maxY; y += 50) {
          const pos1 = isoProject(x, y);
          const pos2 = isoProject(x + 50, y);
          const pos3 = isoProject(x, y + 50);
          
          ctx.beginPath();
          ctx.moveTo((pos1.x * zoom) + gridCenterX, (pos1.y * zoom) + gridCenterY);
          ctx.lineTo((pos2.x * zoom) + gridCenterX, (pos2.y * zoom) + gridCenterY);
          ctx.moveTo((pos1.x * zoom) + gridCenterX, (pos1.y * zoom) + gridCenterY);
          ctx.lineTo((pos3.x * zoom) + gridCenterX, (pos3.y * zoom) + gridCenterY);
          ctx.stroke();
        }
      }

      // Draw terrain
      drawTerrain(ctx, time, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), cameraOffset, zoom);
      
      // Draw agents
      if (agents) {
        // Sort agents by y position for proper depth
        const sortedAgents = [...agents].sort((a, b) => (a.y + a.x) - (b.y + b.x));
        
        sortedAgents.forEach(agent => {
          const isSelected = agent.id === selectedAgent;
          drawCharacter(ctx, agent, isSelected, time, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), cameraOffset, zoom);
        });
      }
      
      // Draw world bounds
      const centerX = (canvas.width / (window.devicePixelRatio || 1)) / 2 + cameraOffset.x;
      const centerY = (canvas.height / (window.devicePixelRatio || 1)) / 2 - 20 + cameraOffset.y;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2 * zoom;
      const bounds = [
        isoProject(WORLD_BOUNDS.minX, WORLD_BOUNDS.minY),
        isoProject(WORLD_BOUNDS.maxX, WORLD_BOUNDS.minY),
        isoProject(WORLD_BOUNDS.maxX, WORLD_BOUNDS.maxY),
        isoProject(WORLD_BOUNDS.minX, WORLD_BOUNDS.maxY)
      ];
      
      ctx.beginPath();
      bounds.forEach((point, i) => {
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method]((point.x * zoom) + centerX, (point.y * zoom) + centerY);
      });
      ctx.closePath();
      ctx.stroke();
      
      // Draw simulation stats
      if (agents) {
        const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
        const activeAgents = agents.filter(a => a.last_thought && a.last_thought.trim().length > 0).length;
        const agentsWithMemory = agents.filter(a => a.memory && a.memory.length > 0).length;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Agents: ${agents.length}`, 15, 25);
        ctx.fillText(`Thinking: ${activeAgents}`, 15, 40);
        ctx.fillText(`With Memory: ${agentsWithMemory}`, 15, 55);
      }
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [agents, selectedAgent, cameraOffset, zoom]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      const moveSpeed = 20;
      
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setCameraOffset(prev => ({ ...prev, y: prev.y + moveSpeed }));
          event.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setCameraOffset(prev => ({ ...prev, y: prev.y - moveSpeed }));
          event.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setCameraOffset(prev => ({ ...prev, x: prev.x + moveSpeed }));
          event.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setCameraOffset(prev => ({ ...prev, x: prev.x - moveSpeed }));
          event.preventDefault();
          break;
        case '=':
        case '+':
          setZoom(prev => Math.min(3, prev * 1.1));
          event.preventDefault();
          break;
        case '-':
        case '_':
          setZoom(prev => Math.max(0.5, prev * 0.9));
          event.preventDefault();
          break;
        case '0':
          setCameraOffset({ x: 0, y: 0 });
          setZoom(1);
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
          borderRadius: '0 0 1rem 1rem',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Navigation controls overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="glass-button p-2 rounded-lg text-white/80 text-xs font-medium">
          <div>🖱️ Drag to pan • ⌨️ WASD/Arrows</div>
          <div>🔍 Scroll to zoom • ⌨️ +/- keys</div>
          <div>🏠 Press 0 to reset view</div>
          <div className="border-t border-white/20 pt-1 mt-1">
            Zoom: {Math.round(zoom * 100)}% | Offset: ({Math.round(cameraOffset.x)}, {Math.round(cameraOffset.y)})
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            onClick={() => setCameraOffset({ x: 0, y: 0 })}
            title="Center view"
          >
            🏠
          </button>
          <button 
            className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            onClick={() => setZoom(1)}
            title="Reset zoom to 100%"
          >
            🔍
          </button>
          <button 
            className="glass-button p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            onClick={() => { setCameraOffset({ x: 0, y: 0 }); setZoom(1); }}
            title="Reset all (same as pressing 0)"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldCanvas;

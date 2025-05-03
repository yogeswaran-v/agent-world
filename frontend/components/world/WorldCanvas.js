import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useThrottledCallback } from 'use-debounce';

// Helper function to convert color names to hex
const colorNameToHex = {
  red: 0xff0000,
  green: 0x00ff00,
  blue: 0x0000ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  purple: 0x800080,
  orange: 0xffa500,
  pink: 0xffc0cb,
  teal: 0x008080,
};

const WorldCanvas = ({ agents, selectedAgent, onAgentClick }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const agentMeshesRef = useRef({});
  const frameIdRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(250, 250, 350);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 32, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333344,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add grid
    const grid = new THREE.GridHelper(500, 50, 0x555555, 0x222222);
    grid.position.y = 0.1;
    scene.add(grid);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(250, 300, 250);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add terrain features
    createTerrain(scene);
    
    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    setIsInitialized(true);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of all meshes and geometries
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []);
  
  // Handle agent updates
  useEffect(() => {
    if (!isInitialized || !sceneRef.current) return;
    
    // Update existing agents and add new ones
    agents.forEach(agent => {
      updateOrCreateAgent(agent);
    });
    
    // Remove agents that no longer exist
    Object.keys(agentMeshesRef.current).forEach(id => {
      if (!agents.some(agent => agent.id.toString() === id)) {
        removeAgent(parseInt(id));
      }
    });
  }, [agents, isInitialized, selectedAgent]);
  
  // Create or update agent in the scene
  const updateOrCreateAgent = (agent) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const id = agent.id.toString();
    const isSelected = agent.id === selectedAgent;
    
    // If agent already exists, update its position
    if (agentMeshesRef.current[id]) {
      const { mesh, label, targetPosition } = agentMeshesRef.current[id];
      
      // Update target position for smooth movement
      targetPosition.x = agent.target_x;
      targetPosition.z = agent.target_y; // y-coordinate in data becomes z in Three.js
      
      // Calculate interpolation based on move progress
      const progress = agent.move_progress;
      const startX = agent.x - (agent.target_x - agent.x) * (1 - progress);
      const startZ = agent.y - (agent.target_y - agent.y) * (1 - progress);
      
      mesh.position.x = startX + (targetPosition.x - startX) * progress;
      mesh.position.z = startZ + (targetPosition.z - startZ) * progress;
      
      // Update label position
      label.position.x = mesh.position.x;
      label.position.z = mesh.position.z;
      
      // Update selection status
      updateAgentSelection(id, isSelected);
      
      return;
    }
    
    // Create new agent mesh
    const geometry = new THREE.SphereGeometry(5, 16, 16);
    const color = colorNameToHex[agent.color] || 0xffffff;
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.7,
      metalness: 0.3,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(agent.x, 5, agent.y); // position y as height (5 units above ground)
    mesh.castShadow = true;
    mesh.userData = { id: agent.id, type: 'agent' };
    
    // Create text label for agent name
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    context.fillStyle = '#ffffff';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(agent.name, 64, 24);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(agent.x, 15, agent.y);
    label.scale.set(30, 15, 1);
    
    // Add to scene
    scene.add(mesh);
    scene.add(label);
    
    // Store in ref
    agentMeshesRef.current[id] = { 
      mesh, 
      label,
      targetPosition: new THREE.Vector3(agent.target_x, 5, agent.target_y)
    };
    
    // Update selection status
    updateAgentSelection(id, isSelected);
  };
  
  // Remove agent from scene
  const removeAgent = (agentId) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const id = agentId.toString();
    if (agentMeshesRef.current[id]) {
      const { mesh, label } = agentMeshesRef.current[id];
      
      scene.remove(mesh);
      scene.remove(label);
      
      // Dispose of geometries and materials
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      if (label.material.map) label.material.map.dispose();
      if (label.material) label.material.dispose();
      
      delete agentMeshesRef.current[id];
    }
  };
  
  // Update agent selection
  const updateAgentSelection = (agentId, isSelected) => {
    const agentObj = agentMeshesRef.current[agentId];
    if (!agentObj) return;
    
    const { mesh } = agentObj;
    
    // Create or update selection indicator
    if (isSelected) {
      if (!agentObj.selectionRing) {
        const geometry = new THREE.TorusGeometry(7, 0.5, 16, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Rotate to be horizontal
        ring.position.y = 1; // Slightly above ground
        
        mesh.add(ring);
        agentObj.selectionRing = ring;
      }
    } else if (agentObj.selectionRing) {
      mesh.remove(agentObj.selectionRing);
      agentObj.selectionRing.geometry.dispose();
      agentObj.selectionRing.material.dispose();
      agentObj.selectionRing = null;
    }
  };
  
  // Handle mouse interaction
  const handleClick = useThrottledCallback((event) => {
    if (!isInitialized || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycaster for picking
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, cameraRef.current);
    
    // Get all agent meshes
    const agentMeshes = Object.values(agentMeshesRef.current).map(a => a.mesh);
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(agentMeshes);
    
    if (intersects.length > 0) {
      const clickedAgentId = intersects[0].object.userData.id;
      onAgentClick(clickedAgentId);
    }
  }, 200); // Throttle to prevent double-clicks
  
  // Create terrain features
  const createTerrain = (scene) => {
    // Create lake
    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(50, 50);
    lakeShape.lineTo(150, 75);
    lakeShape.lineTo(200, 150);
    lakeShape.lineTo(100, 125);
    lakeShape.lineTo(50, 50);
    
    const lakeGeometry = new THREE.ShapeGeometry(lakeShape);
    const lakeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0077be,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });
    
    const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.y = 0.2; // Slightly above ground
    scene.add(lake);
    
    // Create mountains
    const mountainGeometry = new THREE.ConeGeometry(15, 30, 4);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.9
    });
    
    const mountain1 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain1.position.set(350, 15, 300);
    scene.add(mountain1);
    
    const mountain2 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain2.position.set(400, 15, 350);
    scene.add(mountain2);
    
    const mountain3 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain3.position.set(450, 15, 300);
    scene.add(mountain3);
    
    // Create forest
    const treeGeometry = new THREE.ConeGeometry(5, 20, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x008800,
      roughness: 0.8
    });
    
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9
    });
    
    // Place trees
    for (let i = 0; i < 10; i++) {
      const treeGroup = new THREE.Group();
      
      // Create trunk
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2.5;
      treeGroup.add(trunk);
      
      // Create foliage
      const foliage = new THREE.Mesh(treeGeometry, treeMaterial);
      foliage.position.y = 15;
      treeGroup.add(foliage);
      
      // Position the tree
      const x = 300 + (i % 5) * 30;
      const z = 50 + Math.floor(i / 5) * 30;
      treeGroup.position.set(x, 0, z);
      
      scene.add(treeGroup);
    }
  };
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      onClick={handleClick}
    />
  );
};

export default WorldCanvas;
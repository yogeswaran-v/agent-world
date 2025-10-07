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

// Create a 3D character model
const createCharacterModel = (colorName, name) => {
  const characterGroup = new THREE.Group();
  const color = colorNameToHex[colorName] || 0xffffff;
  
  // Body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(3, 4, 12, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: color,
    roughness: 0.6,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 8;
  body.castShadow = true;
  characterGroup.add(body);
  
  // Head (sphere)
  const headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfdbcb4, // Skin tone
    roughness: 0.7,
    metalness: 0.0,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 16;
  head.castShadow = true;
  characterGroup.add(head);
  
  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.8, 16.5, 2);
  characterGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.8, 16.5, 2);
  characterGroup.add(rightEye);
  
  // Hat/Hair
  const hatGeometry = new THREE.ConeGeometry(3, 4, 8);
  const hatMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color).multiplyScalar(0.7), // Darker version of body color
    roughness: 0.8,
    metalness: 0.0,
  });
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.y = 19;
  hat.castShadow = true;
  characterGroup.add(hat);
  
  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.8, 1, 8, 6);
  const armMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfdbcb4,
    roughness: 0.7,
    metalness: 0.0,
  });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-4.5, 10, 0);
  leftArm.rotation.z = 0.3;
  leftArm.castShadow = true;
  characterGroup.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(4.5, 10, 0);
  rightArm.rotation.z = -0.3;
  rightArm.castShadow = true;
  characterGroup.add(rightArm);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(1, 1.2, 6, 6);
  const legMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4169e1, // Blue pants
    roughness: 0.8,
    metalness: 0.0,
  });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-1.5, 1, 0);
  leftLeg.castShadow = true;
  characterGroup.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(1.5, 1, 0);
  rightLeg.castShadow = true;
  characterGroup.add(rightLeg);
  
  // Add walking animation properties
  characterGroup.userData.walkingOffset = Math.random() * Math.PI * 2;
  characterGroup.userData.originalY = 0;
  
  return characterGroup;
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
    
    // Create scene with better atmosphere
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 300, 800); // Atmospheric fog
    
    // Create gradient sky background
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077be) },
        bottomColor: { value: new THREE.Color(0x89cff0) },
        offset: { value: 400 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
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
    
    // Create realistic ground with texture-like material
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 64, 64);
    
    // Add some noise to the ground vertices for natural terrain
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.random() * 2 - 1; // Small height variations
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a5d23, // Natural grass color
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add subtle grid for reference (less prominent)
    const grid = new THREE.GridHelper(500, 25, 0x3a4a1a, 0x2a3a0a);
    grid.position.y = 0.05;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);
    
    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.4); // Soft blue ambient
    scene.add(ambientLight);
    
    // Main sun light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(200, 400, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    scene.add(directionalLight);
    
    // Add hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4a5d23, 0.6);
    scene.add(hemisphereLight);
    
    // Enable shadows in renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
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
    
    // Create 3D character model instead of simple sphere
    const characterGroup = createCharacterModel(agent.color, agent.name);
    characterGroup.position.set(agent.x, 0, agent.y);
    characterGroup.castShadow = true;
    characterGroup.userData = { id: agent.id, type: 'agent' };
    
    const mesh = characterGroup; // Use the character group as the mesh
    
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
    // Create lake (centered in upper-left quadrant)
    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(120, 120);
    lakeShape.lineTo(180, 130);
    lakeShape.lineTo(200, 180);
    lakeShape.lineTo(140, 190);
    lakeShape.lineTo(100, 160);
    lakeShape.lineTo(120, 120);
    
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
    
    // Create mountains (clustered in center-right area)
    const mountainGeometry = new THREE.ConeGeometry(15, 30, 4);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.9
    });
    
    const mountain1 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain1.position.set(320, 15, 240);
    scene.add(mountain1);
    
    const mountain2 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain2.position.set(350, 15, 280);
    scene.add(mountain2);
    
    const mountain3 = new THREE.Mesh(mountainGeometry, mountainMaterial);
    mountain3.position.set(380, 15, 250);
    scene.add(mountain3);
    
    // Create forest (clustered around center)
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
    
    // Place trees in a more natural cluster around the center
    const forestPositions = [
      [240, 180], [260, 200], [280, 170], [250, 220], [270, 240],
      [290, 190], [310, 210], [330, 180], [340, 200], [360, 170],
      [220, 160], [300, 150], [320, 140], [280, 130], [260, 160]
    ];
    
    for (let i = 0; i < Math.min(15, forestPositions.length); i++) {
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
      const [x, z] = forestPositions[i];
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
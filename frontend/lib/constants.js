/**
 * Application constants
 */

// API endpoints
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000';

// Simulation settings
export const DEFAULT_NUM_AGENTS = 10;
export const DEFAULT_SIMULATION_SPEED = 500; // milliseconds
export const MIN_SIMULATION_SPEED = 100;
export const MAX_SIMULATION_SPEED = 5000;

// World settings
export const WORLD_SIZE = 500;
export const INTERACTION_RADIUS = 30;

// Agent settings
export const MAX_MEMORY = 10;
export const MAX_CONVERSATIONS = 10;

// Color mapping
export const AGENT_COLORS = {
  blue: '#1e88e5',
  red: '#e53935',
  green: '#43a047',
  orange: '#fb8c00',
  purple: '#8e24aa',
  cyan: '#00acc1',
  magenta: '#d81b60',
  yellow: '#fdd835',
  teal: '#00897b',
  pink: '#ec407a'
};

// Terrain features
export const TERRAIN_FEATURES = {
  lake: {
    points: [
      { x: 50, y: 50 },
      { x: 150, y: 75 },
      { x: 200, y: 150 },
      { x: 100, y: 125 },
      { x: 50, y: 50 }
    ],
    color: 'rgba(0, 100, 220, 0.3)',
    border: 'rgba(0, 100, 220, 0.5)',
    name: 'Lake'
  },
  mountains: {
    points: [
      { x: 350, y: 300 },
      { x: 400, y: 350 },
      { x: 450, y: 300 },
      { x: 350, y: 300 }
    ],
    color: 'rgba(120, 120, 120, 0.5)',
    border: 'rgba(80, 80, 80, 0.8)',
    name: 'Mountains'
  }
};

// Forest positions (pre-computed)
export const FOREST_POSITIONS = Array(10).fill().map((_, i) => ({
  x: 300 + (i % 5) * 30,
  y: 50 + Math.floor(i / 5) * 30
}));

export default {
  API_BASE_URL,
  WS_BASE_URL,
  DEFAULT_NUM_AGENTS,
  DEFAULT_SIMULATION_SPEED,
  MIN_SIMULATION_SPEED,
  MAX_SIMULATION_SPEED,
  WORLD_SIZE,
  INTERACTION_RADIUS,
  MAX_MEMORY,
  MAX_CONVERSATIONS,
  AGENT_COLORS,
  TERRAIN_FEATURES,
  FOREST_POSITIONS
};
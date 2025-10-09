const WebSocket = require('ws');

console.log('Testing WebSocket connection to backend...');

// Test connecting to the backend WebSocket
const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', function open() {
  console.log('✅ WebSocket connection successful!');
  ws.close();
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket connection failed:', err.message);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
  process.exit(0);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('❌ WebSocket connection timeout');
  ws.close();
  process.exit(1);
}, 5000);
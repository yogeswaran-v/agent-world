// API proxy for simulation control
import http from 'http';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command } = req.body;
    let backendUrl;
    
    // Map commands to backend endpoints
    switch (command) {
      case 'start_simulation':
        backendUrl = 'http://backend:8000/api/agents/start';
        break;
      case 'stop_simulation':
        backendUrl = 'http://backend:8000/api/agents/stop';
        break;
      case 'reset_simulation':
        const { num_agents } = req.body;
        backendUrl = `http://backend:8000/api/agents/reset${num_agents ? `?num_agents=${num_agents}` : ''}`;
        break;
      case 'update_speed':
        const { speed } = req.body;
        backendUrl = `http://backend:8000/api/agents/speed?speed=${speed}`;
        break;
      default:
        return res.status(400).json({ error: 'Unknown command' });
    }

    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(req.body);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const request = http.request(backendUrl, options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data
          });
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
      
      request.write(postData);
      request.end();
    });

    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({ error: 'Backend request failed' });
    }

    const data = response.data ? JSON.parse(response.data) : { status: 'success' };
    res.status(200).json(data);
  } catch (error) {
    console.error('Simulation control proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
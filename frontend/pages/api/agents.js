// API proxy to backend using axios or built-in http
import https from 'https';
import http from 'http';

export default async function handler(req, res) {
  try {
    // Forward the request to the backend (use container network name)
    const backendUrl = 'http://backend:8000/api/agents/';
    
    const response = await new Promise((resolve, reject) => {
      const request = http.get(backendUrl, (response) => {
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
    });

    if (response.statusCode !== 200) {
      return res.status(response.statusCode).json({ error: 'Backend request failed' });
    }

    const data = JSON.parse(response.data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
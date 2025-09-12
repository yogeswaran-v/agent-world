import asyncio
import websockets

async def test_ws():
    uri = "ws://backend:8000/ws"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to backend WebSocket!")
            await websocket.send("{\"command\": \"ping\"}")
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())

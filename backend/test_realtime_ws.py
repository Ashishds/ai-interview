import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8002/ws/v1/realtime/test?token=mock_token"
    print(f"Connecting to {uri}")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # Send ping
            print("Sending ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send text
            print("Sending text message...")
            await websocket.send(json.dumps({"type": "input_text", "text": "Hello, testing 123"}))
            
            for _ in range(30):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    r = json.loads(response)
                    if r.get("type") == "response.audio.delta":
                        print(f"Audio delta received: length {len(r.get('delta', ''))}")
                    else:
                        print(f"Received: {response[:200]}")
                except Exception as e:
                    print(f"Timeout or error: {e}")
                    break
                
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())

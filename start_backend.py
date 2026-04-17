import subprocess
import os
import time
import sys

def run():
    print("--- Starting HireAI Backend ---")
    
    # Kill any process on port 8002
    try:
        print("Closing any processes on port 8002...")
        subprocess.run(["cmd", "/c", "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :8002 ^| findstr LISTENING') do taskkill /F /PID %a"], capture_output=True)
    except Exception as e:
        print(f"Port cleanup warning: {e}")

    # Use absolute path for venv python
    root_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(root_dir, "backend", "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        print(f"Error: Virtual environment python not found at {venv_python}")
        return

    cmd = [
        venv_python, "-m", "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8002",
        "--reload"
    ]
    
    print(f"Executing: {' '.join(cmd)}")
    
    # Set CWD to backend
    os.chdir(os.path.join(root_dir, "backend"))
    
    # Start process and detach on Windows
    # On Windows, creationflags=subprocess.CREATE_NEW_CONSOLE will start it in a new window
    try:
        process = subprocess.Popen(cmd, creationflags=subprocess.CREATE_NEW_CONSOLE)
        print(f"Backend started with PID: {process.pid} in a new console window.")
        print("Wait a few seconds for initialization...")
        time.sleep(5)
    except Exception as e:
        print(f"Failed to start backend: {e}")

if __name__ == "__main__":
    run()

import subprocess
import os
import sys
import time

def run_all():
    print("--- Starting HireAI Full Stack (Fast Mode) ---")
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Scripts to run
    backend_script = os.path.join(root_dir, "start_backend.py")
    frontend_script = os.path.join(root_dir, "start_frontend.py")

    # 1. Start Backend and Frontend in parallel
    print("Launching services...")
    try:
        # We use Popen so we don't wait for the scripts (which have their own sleeps)
        p1 = subprocess.Popen([sys.executable, backend_script])
        p2 = subprocess.Popen([sys.executable, frontend_script])
        
        print("\n[OK] Launch commands sent!")
        print("Backend URL: http://localhost:8002")
        print("API Docs: http://localhost:8002/api/docs")
        print("Frontend URL: http://localhost:3002")
        print("\nServices are initializing in their own windows.")
    except Exception as e:
        print(f"Error launching services: {e}")

    print("\n[OK] Both services started in separate console windows!")
    print("Backend URL: http://localhost:8002")
    print("API Docs: http://localhost:8002/api/docs")
    print("Frontend URL: http://localhost:3002")
    print("\nYou can close this script; the services will keep running.")

if __name__ == "__main__":
    run_all()

import os
import sys
import subprocess
from pathlib import Path

def start():
    # Force absolute paths
    root_dir = Path(__file__).parent.resolve()
    backend_dir = root_dir
    venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
    
    if not venv_python.exists():
        print(f"Error: Virtual environment not found at {venv_python}")
        sys.exit(1)

    print(f"Starting HireAI Backend from: {backend_dir}")
    
    # Set environment variables if needed
    os.environ["PYTHONPATH"] = str(backend_dir)
    
    # Run uvicorn
    cmd = [
        str(venv_python),
        "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8002",
        "--reload",
        "--app-dir", str(backend_dir)
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nBackend stopped.")
    except Exception as e:
        print(f"Failed to start backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start()

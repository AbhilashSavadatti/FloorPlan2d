import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements for the backend."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend_requirements.txt"])
        print("✅ Backend dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def start_backend():
    """Start the Flask backend server."""
    try:
        print("🚀 Starting FloorPlan AI backend server...")
        subprocess.run([sys.executable, "api.py"])
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")
    except Exception as e:
        print(f"❌ Error starting backend: {e}")

if __name__ == "__main__":
    print("🏗️  Setting up FloorPlan AI Backend...")
    
    # Check if requirements are installed
    if not os.path.exists("best.pt"):
        print("❌ Model file 'best.pt' not found. Please ensure the model file is in the project directory.")
        sys.exit(1)
    
    # Install requirements
    if install_requirements():
        start_backend()
    else:
        print("❌ Failed to install requirements. Please check your Python environment.")
        sys.exit(1)
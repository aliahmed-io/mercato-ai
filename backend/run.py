import uvicorn
import os
import sys

# Ensure project root is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", 8008)))
    backend_app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "app"))
    reload_enabled = os.getenv("RELOAD", "1") == "1"
    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=port,
        reload=reload_enabled,
        reload_dirs=[backend_app_dir] if reload_enabled else None,
    )

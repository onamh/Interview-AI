import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory, parent directory, and backend directory
base_dir = Path(__file__).resolve().parent.parent
backend_env = base_dir / ".env"
root_env = base_dir.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
elif root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Default to gemini-2.5-flash or gemini-1.5-flash which are stable models in google-genai
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Whisper Speech-to-Text Configuration
# Options for WHISPER_BACKEND: "local" (100% Free, offline) or "openai" (Cloud API)
WHISPER_BACKEND = os.getenv("WHISPER_BACKEND", "local")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "tiny")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

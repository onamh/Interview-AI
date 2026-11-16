from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import init_db

from app.api.auth_routes import router as auth_router
from app.api.user_routes import router as user_router
from app.api.resume_routes import router as resume_router
from app.api.interview_routes import router as interview_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.history_routes import router as history_router
from app.api.voice_routes import router as voice_router
from app.api.routes import router as legacy_router

app = FastAPI(
    title="Interview AI API",
    description="Interview AI – Prepare smarter. Interview better. Grow confidently.",
    version="2.1.0"
)

# Initialize database tables on application start
@app.on_event("startup")
def on_startup():
    init_db()

# Permissive CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all modular API routers
routers = [
    auth_router,
    user_router,
    resume_router,
    interview_router,
    dashboard_router,
    history_router,
    voice_router,
    legacy_router
]

for r in routers:
    app.include_router(r)
    app.include_router(r, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Interview AI Backend is running successfully!",
        "version": "2.1.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Interview AI Backend"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.database.database import init_db

app = FastAPI(
    title="AI Interview Coach API",
    description="Full-stack AI Mock Interview & Placement Preparation Platform",
    version="2.0.0"
)

# Initialize database tables on application start
@app.on_event("startup")
def on_startup():
    init_db()

# Permissive CORS configuration to prevent any browser blocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router directly and with /api prefix for maximum client flexibility
app.include_router(router)
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "AI Interview Coach Backend is running successfully!",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "AI Interview Coach API"}

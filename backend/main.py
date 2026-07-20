from fastapi import FastAPI

app = FastAPI(
    title="AI Interview Coach",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "AI Interview Coach Backend Running"
    }
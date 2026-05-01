import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from routes import auth, layout, camera

load_dotenv()

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Evacuation System API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(layout.router, prefix="/api/layouts", tags=["Layouts"])
app.include_router(camera.router, prefix="/api/camera", tags=["Camera"])

@app.get("/")
def root():
    return {"message": "Evacuation System API Running"}

@app.get("/db-test")
def test_db():
    try:
        with engine.connect() as conn:
            return {"status": "success", "message": "Connected to Neon DB successfully! 🚀"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
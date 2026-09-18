import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from database.db import engine, Base
from routes import auth, layout, camera, analysis
from services.evacuation import analysis_service

load_dotenv()

app = FastAPI(title="Smart Evacuation System API")


@app.on_event("startup")
def initialize_database() -> None:
    """Create tables when the database is reachable without blocking app boot."""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database schema is ready.")
    except OperationalError as error:
        print(f"Database unavailable during startup; retrying on request: {error}")


@app.on_event("shutdown")
def stop_analysis_workers() -> None:
    analysis_service.close()

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
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])

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
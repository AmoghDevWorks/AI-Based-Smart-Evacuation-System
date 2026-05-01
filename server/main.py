from fastapi import FastAPI
from database.db import engine, Base

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Evacuation System API")

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
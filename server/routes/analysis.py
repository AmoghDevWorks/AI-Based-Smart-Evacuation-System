"""Live camera analysis endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from services.evacuation import analysis_service
from services.layout import get_layout_by_user_id

router = APIRouter()


@router.get("/{user_id}")
def get_analysis(user_id: int, db: Session = Depends(get_db)):
    layout = get_layout_by_user_id(db, user_id)
    if not layout:
        return {"cameras": [], "evacuation_plan": []}
    try:
        return analysis_service.analyze_layout(layout.nodes or [], layout.edges or [])
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Camera analysis failed: {error}") from error

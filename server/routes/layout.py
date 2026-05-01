from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from schemas.layout import LayoutCreate, LayoutResponse
from services.layout import save_layout, get_layout_by_user_id

router = APIRouter()

@router.get("/{user_id}", response_model=LayoutResponse)
def get_user_layout(user_id: int, db: Session = Depends(get_db)):
    layout = get_layout_by_user_id(db, user_id)
    if not layout:
        # Return empty layout instead of 404 so frontend can start fresh
        return LayoutResponse(id=0, user_id=user_id, nodes=[], edges=[])
    return layout

@router.post("/{user_id}", response_model=LayoutResponse)
def save_user_layout(user_id: int, layout_data: LayoutCreate, db: Session = Depends(get_db)):
    # Note: In a real app, verify that the logged-in user matches `user_id`.
    return save_layout(db, user_id, layout_data)

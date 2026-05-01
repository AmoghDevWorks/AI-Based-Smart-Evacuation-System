from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class LayoutBase(BaseModel):
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

class LayoutCreate(LayoutBase):
    pass

class LayoutResponse(LayoutBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

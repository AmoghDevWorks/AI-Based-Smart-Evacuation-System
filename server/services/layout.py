from sqlalchemy.orm import Session
from models.layout import Layout
from schemas.layout import LayoutCreate

def get_layout_by_user_id(db: Session, user_id: int):
    return db.query(Layout).filter(Layout.user_id == user_id).first()

def save_layout(db: Session, user_id: int, layout_data: LayoutCreate):
    layout = get_layout_by_user_id(db, user_id)
    if layout:
        # Update existing
        layout.nodes = layout_data.nodes
        layout.edges = layout_data.edges
    else:
        # Create new
        layout = Layout(
            user_id=user_id,
            nodes=layout_data.nodes,
            edges=layout_data.edges
        )
        db.add(layout)
    
    db.commit()
    db.refresh(layout)
    return layout

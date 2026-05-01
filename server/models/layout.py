from sqlalchemy import Column, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database.db import Base

class Layout(Base):
    __tablename__ = "layouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    nodes = Column(JSON, default=list)
    edges = Column(JSON, default=list)

    user = relationship("User", back_populates="layout")

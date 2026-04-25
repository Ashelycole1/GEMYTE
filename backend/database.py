import json
from sqlalchemy import create_engine, Column, String, Integer, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./gemyte.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class PlayerModel(Base):
    __tablename__ = "players"

    player_id = Column(String, primary_key=True, index=True)
    knowledgeXP = Column(Integer, default=0)
    streakMultiplier = Column(Float, default=1.0)
    unlockedSectors = Column(Text, default="[]") # Store as JSON string

Base.metadata.create_all(bind=engine)

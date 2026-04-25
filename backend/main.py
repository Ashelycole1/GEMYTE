import json
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import SessionLocal, PlayerModel, engine

app = FastAPI(title="Gemyte API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PlayerStats(BaseModel):
    knowledgeXP: int
    streakMultiplier: float
    unlockedSectors: List[str]

@app.get("/stats/{player_id}", response_model=PlayerStats)
def get_player_stats(player_id: str, db: Session = Depends(get_db)):
    player = db.query(PlayerModel).filter(PlayerModel.player_id == player_id).first()
    if not player:
        # Return default if not found
        return PlayerStats(knowledgeXP=0, streakMultiplier=1.0, unlockedSectors=[])
    
    return PlayerStats(
        knowledgeXP=player.knowledgeXP,
        streakMultiplier=player.streakMultiplier,
        unlockedSectors=json.loads(player.unlockedSectors)
    )

@app.post("/stats/{player_id}")
def update_player_stats(player_id: str, stats: PlayerStats, db: Session = Depends(get_db)):
    player = db.query(PlayerModel).filter(PlayerModel.player_id == player_id).first()
    
    unlocked_sectors_json = json.dumps(stats.unlockedSectors)
    
    if not player:
        new_player = PlayerModel(
            player_id=player_id,
            knowledgeXP=stats.knowledgeXP,
            streakMultiplier=stats.streakMultiplier,
            unlockedSectors=unlocked_sectors_json
        )
        db.add(new_player)
    else:
        player.knowledgeXP = stats.knowledgeXP
        player.streakMultiplier = stats.streakMultiplier
        player.unlockedSectors = unlocked_sectors_json
        
    db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

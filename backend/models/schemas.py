from pydantic import BaseModel
from typing import List

class ChallengeOut(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    points: int

class FlagSubmission(BaseModel):
    challenge_id: int
    flag: str

class FlagResponse(BaseModel):
    correct: bool
    message: str

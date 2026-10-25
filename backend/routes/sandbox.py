"""
sandbox.py
Route for running admin code in the sandbox.
POST /sandbox/execute
"""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from backend.services.sandbox_service import run_sandbox

router = APIRouter(prefix="/sandbox", tags=["Sandbox"])


class SandboxPayload(BaseModel):
    code: str


@router.post("/execute")
def execute_sandbox(payload: SandboxPayload, user_id: str = Header(default="1")):
    """Execute Python code in an isolated Docker sandbox. Admin only."""
    if not payload.code or not payload.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    try:
        uid = int(user_id)
    except ValueError:
        uid = 1
    return run_sandbox(uid, payload.code)

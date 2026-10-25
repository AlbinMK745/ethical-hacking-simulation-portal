"""
routes/simulation.py
FastAPI routes for hacking simulation lab management.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..simulation_manager import start_simulation, stop_simulation, get_status

router = APIRouter(prefix="/simulation", tags=["Simulation"])


class StartRequest(BaseModel):
    user_id: int
    sim_type: str = "sqli"   # default to SQL injection lab


class StopRequest(BaseModel):
    container_id: str


@router.post("/start")
def launch_simulation(data: StartRequest):
    """
    Start a simulation container.
    Returns: { container_id, url, port }
    """
    try:
        result = start_simulation(data.user_id, data.sim_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Docker error: {str(e)}. Make sure Docker Desktop is running."
        )


@router.post("/stop")
def stop_sim(data: StopRequest):
    """Stop and remove a running container."""
    ok = stop_simulation(data.container_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to stop container")
    return {"status": "stopped"}


@router.get("/status/{container_id}")
def sim_status(container_id: str):
    """Get the status of a running container."""
    status = get_status(container_id)
    return {"container_id": container_id, "status": status}

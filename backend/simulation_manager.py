"""
simulation_manager.py
Manages Docker containers for hacking simulation labs.
"""
import docker
import random
import threading
import time
from typing import Dict

import sqlite3
import os

_client = None

def _get_client():
    """Lazy initialization of the Docker client with error handling."""
    global _client
    if _client is not None:
        return _client
    
    try:
        _client = docker.from_env()
        # Verify connection immediately
        _client.ping()
        return _client
    except Exception as e:
        print(f"⚠️ Docker service unavailable: {e}")
        _client = None
        return None

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")

# Track active simulations: { container_id: {"user_id", "port", "start_time"} }
_active: Dict[str, dict] = {}
_TTL_SECONDS = 15 * 60   # 15 minutes auto-kill

SIMULATION_IMAGES = {
    # Keys match what the API derives: docker_image.replace("ehsp-", "")
    "sqli-login":            "ehsp-sqli-login",
    "xss-reflected":         "ehsp-xss-reflected",
    "cmd-injection":         "ehsp-cmd-injection",
    "hardcoded-creds":       "ehsp-hardcoded-creds",
    "idor-profile":          "ehsp-idor-profile",
    "linux-flag-hunt":       "ehsp-linux-flag-hunt",
    "stored-xss":            "ehsp-stored-xss",
    "jwt-manipulation":      "ehsp-jwt-manipulation",
    "broken-access-control": "ehsp-broken-access-control",
    "blind-sqli":            "ehsp-blind-sqli",
    "ssrf":                  "ehsp-ssrf",
    "priv-esc":              "ehsp-priv-esc",
    "rce-eval":              "ehsp-rce-eval",
    # Legacy aliases (in case anything uses the old short keys)
    "sqli":                  "ehsp-sqli-login",
    "xss":                   "ehsp-xss-reflected",
    "idor":                  "ehsp-idor-profile",
}


def _auto_cleanup(container_id: str):
    """Kill container automatically after TTL."""
    time.sleep(_TTL_SECONDS)
    stop_simulation(container_id)


def start_simulation(user_id: int, sim_type: str) -> dict:
    """
    Launch a simulation container for the given user.
    Returns { container_id, url, port }.
    Raises ValueError for unknown sim_type.
    Raises RuntimeError if Docker is unavailable.
    """
    image = SIMULATION_IMAGES.get(sim_type)
    
    if not image:
        # Dynamic fallback: assume image name is ehsp-<sim_type>
        # This allows admins to add new ehsp- prefixed images without code changes
        image = f"ehsp-{sim_type}"

    # If user already has a running sim of this type, stop it first
    for cid, meta in list(_active.items()):
        if meta["user_id"] == user_id and meta["sim_type"] == sim_type:
            stop_simulation(cid)
            break

    # Pick a free random port in range 8100–8999
    port = random.randint(8100, 8999)

    container_name = f"ehsp_{sim_type}_{user_id}"

    client = _get_client()
    if not client:
        raise RuntimeError("Docker service is not available. Please start Docker Desktop.")

    # Remove stale container with same name if exists
    try:
        old = client.containers.get(container_name)
        old.remove(force=True)
    except docker.errors.NotFound:
        pass

    try:
        # Pre-check if image exists to give better error
        client.images.get(image)
    except docker.errors.ImageNotFound:
        raise RuntimeError(f"Docker image '{image}' not found. Please build the simulation images first.")

    container = client.containers.run(
        image,
        detach=True,
        ports={"5000/tcp": port},
        name=container_name,
        network_mode="bridge",
        mem_limit="256m",
        mem_reservation="128m",
        cpu_period=100000,
        cpu_quota=50000, # 50% of 1 CPU
        labels={"ehsp": "simulation", "user_id": str(user_id)},
    )

    _active[container.id] = {
        "user_id": user_id,
        "sim_type": sim_type,
        "port": port,
        "start_time": time.time(),
    }

    # ✅ Record session in database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Find challenge id from sim_type
        cursor.execute("SELECT id FROM challenges WHERE sim_type = ?", (sim_type,))
        chal_row = cursor.fetchone()
        challenge_id = chal_row[0] if chal_row else 0

        cursor.execute("""
            INSERT INTO sandbox_sessions 
            (user_id, challenge_id, container_id, container_name, port, status, started_at)
            VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
        """, (user_id, challenge_id, container.id, container_name, port))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error recording sandbox session: {e}")

    # Auto-kill after TTL
    t = threading.Thread(target=_auto_cleanup, args=(container.id,), daemon=True)
    t.start()

    return {
        "container_id": container.id,
        "url": f"http://localhost:{port}",
        "port": port,
    }


def stop_simulation(container_id: str) -> bool:
    """Stop and remove a container. Returns True on success."""
    client = _get_client()
    if not client:
        print("❌ Cannot stop simulation: Docker service unavailable.")
        return False

    try:
        c = client.containers.get(container_id)
        c.stop(timeout=5)
        c.remove(force=True)

        
        # ✅ Mark as stopped in database
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sandbox_sessions 
                SET status='stopped', stopped_at=CURRENT_TIMESTAMP 
                WHERE container_id=?
            """, (container_id,))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"Error updating sandbox status in DB: {db_err}")

    except docker.errors.NotFound:
        # Even if docker found nothing, ensure DB is updated if it was active
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("UPDATE sandbox_sessions SET status='stopped' WHERE container_id=? AND status='active'", (container_id,))
            conn.commit()
            conn.close()
        except: pass
    except Exception:
        return False
    finally:
        _active.pop(container_id, None)
    return True


def get_status(container_id: str) -> str:
    """Return 'running', 'stopped', or 'not_found'."""
    client = _get_client()
    if not client:
        return "docker_unavailable"

    try:
        c = client.containers.get(container_id)
        return c.status          # 'running', 'exited', etc.
    except docker.errors.NotFound:
        return "not_found"


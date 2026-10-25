"""
sandbox_service.py
Handles admin code execution inside isolated Docker containers.
Logs results to sandbox_exec_logs table.
"""
import time
import uuid
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app.db")

_docker_client = None


def _get_docker():
    global _docker_client
    if _docker_client is not None:
        return _docker_client
    try:
        import docker as docker_lib
        _docker_client = docker_lib.from_env()
        _docker_client.ping()
        return _docker_client
    except Exception as e:
        print(f"⚠️ Docker unavailable in sandbox_service: {e}")
        _docker_client = None
        return None


def run_sandbox(user_id: int, code: str) -> dict:
    """
    Run arbitrary Python code inside an isolated Docker container.
    Returns output, execution_time, exit_code, and any flag (timeout/memory).
    """
    client = _get_docker()
    if not client:
        return {
            "output": "❌ Docker is not available. Make sure Docker Desktop is running.",
            "execution_time": 0.0,
            "exit_code": -1,
            "flag": "docker_unavailable"
        }

    # Escape code for shell: wrap in single quotes, escape existing single quotes
    safe_code = code.replace("\\", "\\\\").replace("\"", "\\\"").replace("$", "\\$")

    start_time = time.time()
    container_id_str = str(uuid.uuid4())[:12]

    try:
        import docker as docker_lib

        container = client.containers.run(
            image="python:3.10-alpine",
            command=["python", "-c", code],
            detach=True,
            mem_limit="128m",
            network_mode="none",
            read_only=True,
            security_opt=["no-new-privileges"],
            cap_drop=["ALL"],
            pids_limit=50,
            tty=False,
            stdin_open=False,
        )

        try:
            result = container.wait(timeout=6)
            exit_code = result.get("StatusCode", -1)
        except Exception:
            container.remove(force=True)
            execution_time = time.time() - start_time
            _log_execution(user_id, container_id_str, execution_time, 0, -1, "", code, "timeout")
            return {
                "output": "⏱ Execution timed out (> 6 seconds).",
                "execution_time": execution_time,
                "exit_code": -1,
                "flag": "timeout"
            }

        logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")

        # Get memory usage
        memory_used = 0
        try:
            stats = container.stats(stream=False)
            memory_used = stats.get("memory_stats", {}).get("usage", 0)
        except Exception:
            pass

        container.remove(force=True)
        execution_time = time.time() - start_time

        # Detect flags
        flag = None
        if execution_time > 5:
            flag = "timeout"
        if memory_used > 100_000_000:
            flag = "memory_exceeded"

        _log_execution(user_id, container_id_str, execution_time, memory_used, exit_code, logs, code, flag)

        return {
            "output": logs if logs.strip() else "(no output)",
            "execution_time": round(execution_time, 3),
            "exit_code": exit_code,
            "memory_used": memory_used,
            "flag": flag
        }

    except docker_lib.errors.ImageNotFound:
        return {
            "output": "❌ Docker image 'python:3.10-alpine' not found.\nRun: docker pull python:3.10-alpine",
            "execution_time": 0.0,
            "exit_code": -1,
            "flag": "image_missing"
        }
    except Exception as e:
        return {
            "output": f"❌ Sandbox error: {str(e)}",
            "execution_time": round(time.time() - start_time, 3),
            "exit_code": -1,
            "flag": "error"
        }


def _log_execution(user_id, container_id, execution_time, memory_used, exit_code, output, code, flag):
    """Write execution record to sandbox_exec_logs table."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sandbox_exec_logs
            (user_id, container_id, execution_time, memory_used, exit_code, output, code_snippet, flag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, container_id, execution_time, memory_used, exit_code,
              output[:2000], code[:500], flag))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Failed to log sandbox execution: {e}")


def ensure_exec_logs_table():
    """Create sandbox_exec_logs table if it doesn't exist."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sandbox_exec_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                container_id TEXT,
                execution_time REAL,
                memory_used INTEGER DEFAULT 0,
                exit_code INTEGER,
                output TEXT,
                code_snippet TEXT,
                flag TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Failed to create sandbox_exec_logs table: {e}")

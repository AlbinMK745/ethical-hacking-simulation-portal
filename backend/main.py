from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware



# Routers
from .routes.auth import router as auth_router
from .routes.admin import router as admin_router

from .routes.progress import router as progress_router
from .routes.user import router as users_router
from .routes.user import router as users_router
from .routes.user_tutorials import router as user_tutorials_router
from .routes.user_attempts import router as user_attempts_router
from .routes.user_dashboard import router as user_dashboard_router
from .routes.user_progress import router as user_progress_router
from .routes.admin_users import router as admin_users_router
from backend.routes import admin_notifications
from .routes import user_leaderboard
from .routes import user_achievements
from .routes import user_notes
from .routes import user_profile
from .routes import user_challenges
from .routes import user
from .routes import daily_challenge
from .routes import user_notifications
from .routes import chat
from .routes import modules
from .routes import admin_modules
from .routes import user_profile_edit
from .routes import user_profile_extended
from .routes import social
from .routes import ws_social
from .routes import simulation
from .routes import sandbox as sandbox_route
from .routes import ai as ai_route
from .routes import xp as xp_route
from .routes import ws_notifications as ws_route
from .services.sandbox_service import ensure_exec_logs_table




app = FastAPI(title="Ethical Hacking Simulator API")

# ✅ CORS Configuration - Allow all origins including file://
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# CORS (only once)
# Removed duplicate CORS middleware

# Root
@app.get("/")
def root():
    return {"Ethical Hacking Simulation Protal"}

# Routers (each ONLY ONCE)
app.include_router(auth_router)
app.include_router(admin_router)

app.include_router(progress_router)
# app.include_router(users_router) # Removed duplicate
# app.include_router(users_router) # Removed duplicate
app.include_router(user_tutorials_router)
app.include_router(user_attempts_router)
app.include_router(user_dashboard_router)
app.include_router(user_progress_router)
app.include_router(admin_users_router)
app.include_router(admin_notifications.router)
app.include_router(user_leaderboard.router)
app.include_router(user_achievements.router)
app.include_router(user_notes.router)
app.include_router(user_profile.router)
app.include_router(user_challenges.router)
app.include_router(user.router) # Keep this one as it seems to be the main user router
app.include_router(daily_challenge.router)
app.include_router(user_notifications.router)
app.include_router(chat.router)
app.include_router(modules.router)
app.include_router(admin_modules.router)
app.include_router(user_profile_edit.router)
app.include_router(user_profile_extended.router)
app.include_router(social.router)
app.include_router(ws_social.router)
app.include_router(simulation.router)
app.include_router(sandbox_route.router)
app.include_router(ai_route.router)
app.include_router(xp_route.router)
app.include_router(ws_route.router)



# ✅ Create sandbox_exec_logs table on startup
ensure_exec_logs_table()

# ✅ Run XP system migration on startup
try:
    from .migrations.add_xp_system import run as run_xp_migration
    run_xp_migration()
except Exception as e:
    print(f"[XP Migration] Warning: {e}")


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app.mount("/frontend", StaticFiles(directory=os.path.join(BASE_DIR, "frontend")), name="frontend")

import sqlite3
import os
import sys

# Add the project root to sys.path to allow importing from backend
sys.path.append(os.getcwd())

from backend.database import get_db, sync_user_points

def main():
    print("Starting full point synchronization...")
    
    conn = get_db()
    cur = conn.cursor()
    
    # Get all users with 'user' role
    cur.execute("SELECT id, username FROM users WHERE role = 'user'")
    users = cur.fetchall()
    
    count = 0
    for user_id, username in users:
        print(f"Syncing points for user: {username} (ID: {user_id})...", end=" ")
        new_points = sync_user_points(user_id, conn)
        print(f"DONE. New Total: {new_points}")
        count += 1
    
    conn.close()
    print(f"Successfully synchronized points for {count} users.")

if __name__ == "__main__":
    main()

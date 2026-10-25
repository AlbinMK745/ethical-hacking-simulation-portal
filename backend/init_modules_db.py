import sqlite3
import os

DB_PATH = "backend/app.db"

def init_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Initializing Module System Tables...")

    # 1. Modules Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        difficulty TEXT DEFAULT 'Beginner',
        category TEXT DEFAULT 'General',
        thumbnail_url TEXT,
        is_published BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        views INTEGER DEFAULT 0
    )
    """)
    print("- 'modules' table checked/created.")

    # 2. Rooms Table (Sub-units of modules)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        order_index INTEGER DEFAULT 0,
        points INTEGER DEFAULT 10,
        content_type TEXT DEFAULT 'text',
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
    )
    """)
    print("- 'rooms' table checked/created.")

    # 3. User Progress Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_module_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        module_id INTEGER NOT NULL,
        progress_percent INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
    )
    """)
    print("- 'user_module_progress' table checked/created.")

    # 4. Room Completion Tracking (Granular progress)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_room_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        completed BOOLEAN DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
    )
    """)
    print("- 'user_room_progress' table checked/created.")


    # Optional: Migrate existing tutorials to modules if modules is empty
    cur.execute("SELECT count(*) FROM modules")
    count = cur.fetchone()[0]
    
    if count == 0:
        print("Migrating existing 'tutorials' to 'modules'...")
        cur.execute("SELECT * FROM tutorials")
        tutorials = cur.fetchall()
        
        # Get column names to map correctly
        cur.execute("PRAGMA table_info(tutorials)")
        columns = [col[1] for col in cur.fetchall()]
        
        for t in tutorials:
            t_dict = dict(zip(columns, t))
            
            # Insert into modules
            cur.execute("""
            INSERT INTO modules (title, description, difficulty, category, created_at, views)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                t_dict.get('title'),
                t_dict.get('content')[:200] + "..." if t_dict.get('content') else "", # Use snippet of content as description
                t_dict.get('difficulty', 'Beginner'),
                t_dict.get('category', 'General'),
                t_dict.get('created_at'),
                t_dict.get('views', 0)
            ))
            
            module_id = cur.lastrowid
            
            # Create a default room for the content
            cur.execute("""
            INSERT INTO rooms (module_id, title, content, order_index, points)
            VALUES (?, ?, ?, ?, ?)
            """, (
                module_id,
                "Introduction",
                t_dict.get('content', ''),
                0,
                10
            ))
            
        print(f"Migrated {len(tutorials)} tutorials.")

    conn.commit()
    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()

"""
XP Service — centralised XP award logic, level calculation, and rank titles.
"""

import sqlite3
from datetime import datetime, date, timedelta
from backend.database import get_db

# ── LEVEL THRESHOLDS ──────────────────────────────────────────────────────────
# (min_xp, level_number, rank_title)
LEVEL_TABLE = [
    (0,     1,  "Script Kiddie"),
    (100,   2,  "Curious Hacker"),
    (250,   3,  "Recon Agent"),
    (450,   4,  "Packet Sniffer"),
    (700,   5,  "Exploit Dev"),
    (1000,  6,  "Shell Whisperer"),
    (1400,  7,  "Root Hunter"),
    (1900,  8,  "Zero-Day Seeker"),
    (2500,  9,  "Red Teamer"),
    (3200,  10, "Cyber Phantom"),
    (4000,  11, "Shadow Operator"),
    (5000,  12, "Elite Hacker"),
    (6500,  13, "Black-Hat Buster"),
    (8000,  14, "Ghost Protocol"),
    (10000, 15, "LEGENDARY"),
]

# XP rewards per action
XP_REWARDS = {
    "challenge_easy":     50,
    "challenge_medium":   100,
    "challenge_hard":     200,
    "challenge_insane":   400,
    "daily_challenge":    150,
    "tutorial_complete":  75,
    "daily_login":        25,
    "streak_bonus":       50,   # awarded at every 7-day streak milestone
    "first_blood":        500,  # first person to solve a challenge
    "quiz_perfect":       100,
    "writeup_approved":   200,
}


def get_level_info(xp: int) -> dict:
    """Return level number, rank title, XP for current level start & next level."""
    level = 1
    title = LEVEL_TABLE[0][2]
    current_start = 0
    next_start = LEVEL_TABLE[1][0]

    for i, (min_xp, lvl, rank) in enumerate(LEVEL_TABLE):
        if xp >= min_xp:
            level = lvl
            title = rank
            current_start = min_xp
            next_start = LEVEL_TABLE[i + 1][0] if i + 1 < len(LEVEL_TABLE) else min_xp + 9999
        else:
            break

    xp_in_level = xp - current_start
    xp_needed   = next_start - current_start
    progress_pct = min(100, int((xp_in_level / xp_needed) * 100)) if xp_needed > 0 else 100

    return {
        "level":        level,
        "title":        title,
        "xp":           xp,
        "xp_in_level":  xp_in_level,
        "xp_needed":    xp_needed,
        "progress_pct": progress_pct,
        "current_start": current_start,
        "next_start":   next_start,
    }


def award_xp(user_id: int, amount: int, reason: str, source_id: int = None) -> dict:
    """
    Award XP to a user. Updates xp + level in users table.
    Returns a dict with old_level, new_level, leveled_up, new_xp, level_info.
    """
    conn = get_db()
    cur  = conn.cursor()

    # Get current XP
    row = cur.execute("SELECT xp, level FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": "user not found"}

    old_xp    = row["xp"] or 0
    old_level = row["level"] or 1
    new_xp    = old_xp + amount

    # Recalculate level
    info      = get_level_info(new_xp)
    new_level = info["level"]

    # Persist
    cur.execute(
        "UPDATE users SET xp = ?, level = ? WHERE id = ?",
        (new_xp, new_level, user_id)
    )
    cur.execute(
        """INSERT INTO xp_transactions (user_id, amount, reason, source_id)
           VALUES (?, ?, ?, ?)""",
        (user_id, amount, reason, source_id)
    )
    conn.commit()
    conn.close()

    return {
        "old_level":  old_level,
        "new_level":  new_level,
        "leveled_up": new_level > old_level,
        "xp_gained":  amount,
        "new_xp":     new_xp,
        "level_info": info,
    }


def get_user_xp_summary(user_id: int) -> dict:
    """Return full XP/level summary for a user."""
    conn = get_db()
    cur  = conn.cursor()

    row = cur.execute("SELECT xp, level, streak FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        return {}

    xp     = row["xp"] or 0
    streak = row["streak"] or 0
    info   = get_level_info(xp)

    # Recent XP history (last 10)
    history = cur.execute("""
        SELECT amount, reason, created_at
        FROM xp_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    """, (user_id,)).fetchall()

    # Total XP this week
    weekly_xp = cur.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM xp_transactions
        WHERE user_id = ? AND created_at >= datetime('now', '-7 days') AND amount > 0
    """, (user_id,)).fetchone()[0]

    # Shields
    shield_row = cur.execute(
        "SELECT shields FROM streak_shields WHERE user_id = ?", (user_id,)
    ).fetchone()
    shields = shield_row["shields"] if shield_row else 0

    conn.close()

    return {
        **info,
        "streak":     streak,
        "weekly_xp":  weekly_xp,
        "shields":    shields,
        "history": [
            {"amount": h["amount"], "reason": h["reason"], "at": h["created_at"]}
            for h in history
        ]
    }


def handle_daily_login(user_id: int) -> dict:
    """
    Call this on every login. Manages streak, awards login XP.
    Returns {'streak': int, 'xp_gained': int, 'streak_milestone': bool}
    """
    conn = get_db()
    cur  = conn.cursor()

    row = cur.execute(
        "SELECT streak, last_active FROM users WHERE id = ?", (user_id,)
    ).fetchone()

    if not row:
        conn.close()
        return {}

    today       = date.today()
    last_active = row["last_active"]
    streak      = row["streak"] or 0
    xp_gained   = 0
    milestone   = False

    if last_active:
        last_date = date.fromisoformat(last_active) if isinstance(last_active, str) else last_active
        diff = (today - last_date).days

        if diff == 0:
            # Already logged in today
            conn.close()
            return {"streak": streak, "xp_gained": 0, "streak_milestone": False, "already_done": True}
        elif diff == 1:
            streak += 1
        else:
            # Check for streak shield
            shield_row = cur.execute(
                "SELECT shields FROM streak_shields WHERE user_id = ?", (user_id,)
            ).fetchone()
            if shield_row and shield_row["shields"] > 0:
                cur.execute(
                    "UPDATE streak_shields SET shields = shields - 1 WHERE user_id = ?", (user_id,)
                )
                streak += 1  # shield used, streak preserved
            else:
                streak = 1   # reset streak
    else:
        streak = 1

    # Milestone bonus at every 7-day interval
    if streak % 7 == 0:
        milestone = True

    # Update streak & last_active
    cur.execute(
        "UPDATE users SET streak = ?, last_active = ? WHERE id = ?",
        (streak, str(today), user_id)
    )
    conn.commit()
    conn.close()

    # Award login XP (outside the streak update conn)
    result = award_xp(user_id, XP_REWARDS["daily_login"], "daily_login")
    xp_gained += XP_REWARDS["daily_login"]

    if milestone:
        award_xp(user_id, XP_REWARDS["streak_bonus"], "streak_bonus")
        xp_gained += XP_REWARDS["streak_bonus"]

    return {
        "streak":            streak,
        "xp_gained":         xp_gained,
        "streak_milestone":  milestone,
        "leveled_up":        result.get("leveled_up", False),
        "level_info":        result.get("level_info", {}),
    }

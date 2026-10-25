# EHSP Challenges System — README

## Overview

The Challenges section is a core feature of the Ethical Hacking Simulation Portal. It has two kinds of challenges:

| Type | Description |
|---|---|
| **Static Challenge** | Text description + flag submission form. The flag is a known string you must find through research or theory. |
| **Docker Simulation Lab** | A real vulnerable web app spun up as a Docker container. You hack it live, find the flag, paste it back. |

---

## Folder Structure

```
ethical-hacking-portal/
│
├── backend/
│   ├── simulation_manager.py          # Docker container lifecycle management
│   └── routes/
│       ├── user_challenges.py         # REST API for challenges (GET, submit, stats)
│       └── simulation.py             # REST API for launching/stopping Docker labs
│
├── simulations/                       # One folder per Docker lab
│   ├── sqli-login/                    # SQL Injection
│   ├── xss-reflected/                 # Reflected XSS
│   ├── cmd-injection/                 # Command Injection
│   ├── hardcoded-creds/              # Hardcoded Credentials
│   ├── idor-profile/                  # IDOR
│   ├── linux-flag-hunt/              # Linux Enumeration
│   ├── stored-xss/                    # Stored XSS
│   ├── jwt-manipulation/             # JWT Manipulation
│   ├── broken-access-control/        # Broken Access Control
│   ├── blind-sqli/                    # Blind SQL Injection
│   ├── ssrf/                          # SSRF
│   ├── priv-esc/                      # Privilege Escalation
│   └── rce-eval/                      # RCE via eval()
│
└── frontend/user/
    └── user.js                        # Challenge card rendering + sim lab launch UI
```

Each lab folder contains:
- `app.py` — vulnerable Flask web app
- `Dockerfile` — image build config
- `requirements.txt` — Python dependencies

---

## Database Schema

```sql
-- All challenges (static + Docker labs)
CREATE TABLE challenges (
    id             INTEGER PRIMARY KEY,
    title          TEXT,
    description    TEXT,
    difficulty     TEXT,      -- 'Easy', 'Medium', 'Hard'
    points         INTEGER,
    category       TEXT,
    correct_flag   TEXT,
    docker_image   TEXT       -- NULL for static, 'ehsp-<name>' for Docker labs
);

-- Per-user progress
CREATE TABLE user_challenges (
    user_id       INTEGER,
    challenge_id  INTEGER,
    status        TEXT,       -- 'in_progress', 'solved'
    attempts      INTEGER DEFAULT 0,
    score         INTEGER DEFAULT 0,
    solved_at     DATETIME
);

-- All flag submission attempts (for stats & leaderboard)
CREATE TABLE challenge_attempts (
    id             INTEGER PRIMARY KEY,
    user_id        INTEGER,
    challenge_id   INTEGER,
    submitted_flag TEXT,
    is_correct     INTEGER,   -- 0 or 1
    attempted_at   DATETIME
);

-- Deduped correct submissions (used for points + leaderboard)
CREATE TABLE submissions (
    user_id       INTEGER,
    challenge_id  INTEGER,
    submitted_flag TEXT,
    is_correct    INTEGER,
    UNIQUE(user_id, challenge_id)
);
```

---

## API Endpoints

### Challenges

| Method | URL | Auth Header | Description |
|---|---|---|---|
| `GET` | `/user/challenges/` | `user-id: <id>` | List all challenges with user progress |
| `GET` | `/user/challenges/{id}` | — | Get single challenge details |
| `POST` | `/user/challenges/start/{id}` | `user-id: <id>` | Mark challenge as started |
| `POST` | `/user/challenges/submit/{id}?flag=<flag>` | `user-id: <id>` | Submit a flag |
| `GET` | `/user/challenges/attempts` | `user-id: <id>` | Get attempt history |
| `GET` | `/user/challenges/{id}/stats` | — | Solve/attempt stats for a challenge |

### Simulation Labs

| Method | URL | Body | Description |
|---|---|---|---|
| `POST` | `/simulation/start` | `{"user_id": 1, "sim_type": "sqli"}` | Launch a Docker lab container |
| `POST` | `/simulation/stop` | `{"container_id": "abc123"}` | Stop and remove the container |
| `GET` | `/simulation/status/{container_id}` | — | Check if container is running |

---

## How a Sim Lab Launch Works (Step by Step)

```
User clicks "Launch Lab"
        │
        ▼
frontend/user.js → POST /simulation/start
        │           body: { user_id, sim_type }
        │
        ▼
backend/routes/simulation.py → simulation_manager.start_simulation()
        │
        ▼
simulation_manager.py:
  1. Looks up: SIMULATION_IMAGES[sim_type] → Docker image name
  2. Picks random port (8100–8999)
  3. Runs: docker container run -p <port>:5000 --name ehsp_<type>_<uid> <image>
  4. Starts 15-minute auto-kill timer in background thread
  5. Returns: { container_id, url: "http://localhost:<port>", port }
        │
        ▼
Frontend opens tab: http://localhost:<port>
        │
        ▼
User hacks the lab, copies the flag
        │
        ▼
User pastes flag into Submit Flag field → POST /user/challenges/submit/{id}?flag=...
        │
        ▼
Backend compares with `challenges.correct_flag`
  ✅ Correct → marks solved, awards points, updates leaderboard
  ❌ Wrong   → increments attempts counter
```

---

## All 13 Labs — Quick Reference

### 🟢 Beginner

| Lab | `sim_type` | How to Solve | Flag |
|---|---|---|---|
| SQL Injection | `sqli` | Login form SQLi: username `' OR 1=1--` | `EHSP{sqli_bypass_success}` |
| Reflected XSS | `xss-reflected` | Inject `<script>` in the `?q=` search param | `EHSP{xss_reflected_win}` |
| Command Injection | `cmd-injection` | Append `; cat /flag.txt` to the ping field | `EHSP{cmd_injection_win}` |
| Hardcoded Credentials | `hardcoded-creds` | View page source / JS file to find password | `EHSP{hardcoded_creds_found}` |
| IDOR | `idor-profile` | Change `/profile/2` → `/profile/1` in the URL | `EHSP{idor_admin_access}` |
| Linux Flag Hunt | `linux-flag-hunt` | Use terminal: `find / -name "*.txt" 2>/dev/null` | `EHSP{linux_enumeration_flag}` |

### 🟡 Intermediate

| Lab | `sim_type` | How to Solve | Flag |
|---|---|---|---|
| Stored XSS | `stored-xss` | Post `<script>fetch('/steal?data='+document.cookie)</script>` as a comment, then visit `/admin` | `EHSP{stored_xss_persisted}` |
| JWT Manipulation | `jwt-manipulation` | Change header to `alg:none`, change payload `role` to `admin`, strip signature | `EHSP{jwt_admin_escalation}` |
| Broken Access Control | `broken-access-control` | `GET /api/admin-data` with header `X-Role: admin` | `EHSP{bac_admin_panel}` |

### 🔴 Advanced

| Lab | `sim_type` | How to Solve | Flag |
|---|---|---|---|
| Blind SQLi | `blind-sqli` | Boolean: `alice' AND SUBSTR((SELECT value FROM secrets WHERE key='flag'),1,1)='E'--` | `EHSP{blind_sqli_extracted}` |
| SSRF | `ssrf` | Submit URL `http://127.0.0.1:8888/secret` to the webhook fetcher | `EHSP{ssrf_internal_reached}` |
| Privilege Escalation | `priv-esc` | Terminal: `sudo /usr/local/sbin/suid-reader /root/flag.txt` | `EHSP{privesc_root_achieved}` |
| RCE via eval | `rce-eval` | Submit expression: `open('/tmp/flag.txt').read()` | `EHSP{rce_eval_code_exec}` |

---

## How to Test a Lab Manually

### Option A — Via the EHSP Portal (Normal User Flow)
1. Log in as a user at `http://localhost:8000/frontend/user-login.html`
2. Go to **Challenges** in the sidebar
3. Click any Docker challenge card
4. Click **🚀 Launch Lab** — the lab opens in a new tab
5. Solve the challenge, copy the flag
6. Paste the flag into the Submit field and click **Submit**

### Option B — Direct Docker Run (Dev/Debug)
Run any lab directly without the portal:

```bash
# Replace <IMAGE> and <PORT> with your choice
docker run --rm -p <PORT>:5000 <IMAGE>
# Example:
docker run --rm -p 8200:5000 ehsp-sqli-login
```

Then open `http://localhost:8200` in your browser.

### Option C — Test the API with curl

**Launch a lab:**
```bash
curl -X POST http://localhost:8000/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "sim_type": "sqli"}'
# Returns: {"container_id": "abc123...", "url": "http://localhost:8312", "port": 8312}
```

**Submit a flag:**
```bash
curl -X POST "http://localhost:8000/user/challenges/submit/1?flag=EHSP{sqli_bypass_success}" \
  -H "user-id: 1"
# Returns: {"correct": true, "points_earned": 150, "total_points": 150}
```

**Stop a lab:**
```bash
curl -X POST http://localhost:8000/simulation/stop \
  -H "Content-Type: application/json" \
  -d '{"container_id": "abc123..."}'
```

### Option D — Verify All Images Are Built
```bash
docker images | grep ehsp
```
Should show 13 `ehsp-*` images.

### Option E — Verify All Challenges Are Seeded
```bash
python verify_labs.py
```

---

## Frontend Flow (`user.js`)

1. **`loadChallenges()`** — calls `GET /user/challenges/`, renders challenge cards
2. **`renderChallengeCard(c)`** — if `c.is_sim_lab === true`, shows a 🐳 Docker badge
3. **`openChallenge(c)`** — if sim lab, shows **Launch Lab + Submit Flag** modal; otherwise shows simple flag submit modal
4. **"Launch Lab" button** — calls `launchSimLab()` → `POST /simulation/start` → opens new tab
5. **"Stop Lab" button** — calls `stopSimLab()` → `POST /simulation/stop`
6. **Flag submit** — calls `POST /user/challenges/submit/{id}?flag=<value>`
7. On ✅ correct: card updates to **Solved** with a green badge; points update in header

---

## Lab Container Lifecycle

| Event | What Happens |
|---|---|
| User clicks Launch | Container starts with random port 8100–8999 |
| Same user launches same lab again | Old container is killed first, new one starts |
| 15 minutes pass | Container is auto-killed by background thread |
| User clicks Stop Lab | Container is immediately killed |
| Container name collision | Old container with same name is force-removed before start |

---

## Adding a New Lab

1. Create `simulations/<lab-name>/app.py` (Flask app with `FLAG = "EHSP{...}"`)
2. Create `simulations/<lab-name>/Dockerfile` + `requirements.txt`
3. Build: `docker build -t ehsp-<lab-name> simulations/<lab-name>`
4. Register in `backend/simulation_manager.py`:
   ```python
   SIMULATION_IMAGES["<sim_type>"] = "ehsp-<lab-name>"
   ```
5. Seed the DB:
   ```python
   INSERT INTO challenges (title, description, difficulty, points, category, correct_flag, docker_image)
   VALUES ('Lab Title', 'Description', 'Medium', 200, 'Category', 'EHSP{flag}', 'ehsp-<lab-name>');
   ```
6. Done — the lab automatically appears in the Challenges UI with a Docker badge.

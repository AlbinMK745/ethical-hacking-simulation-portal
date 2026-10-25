"""
AI Service — Groq (llama-3.3-70b-versatile)
Hint Generator + Vulnerability Explanation
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
_MODEL_NAME = "llama-3.3-70b-versatile"


def _call_groq(prompt: str, max_tokens: int = 1000) -> str:
    """Wrapper with error handling."""
    try:
        resp = _client.chat.completions.create(
            model=_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq Service Error [{_MODEL_NAME}]: {e}")
        raise e


def generate_hint(title: str, description: str, attempts: int) -> str:
    prompt = f"""You are a friendly cybersecurity tutor helping a complete beginner who has never done hacking before.

The student is stuck on this challenge:

Title: {title}
Description: {description}
Failed Attempts: {attempts}

YOUR GOAL: Give them ONE simple, encouraging nudge in the right direction.

STRICT RULES:
- Write for a TOTAL BEGINNER. Use plain, everyday English. No technical jargon.
- If you must use a technical term, explain it in simple words immediately after.
- Use a real-world analogy or comparison if it helps (e.g. "like picking a lock", "like leaving a note").
- Keep it to 2-3 SHORT sentences maximum.
- Do NOT reveal the flag, the answer, or any CTF string.
- Do NOT provide code, payloads, or specific commands to type.
- Do NOT ask multiple questions — give ONE clear, simple idea.
- Sound friendly and encouraging, not robotic.

Output format — start directly with the hint, no label needed:
<your simple beginner-friendly hint here>"""

    return _call_groq(prompt, max_tokens=200)


def generate_explanation(title: str, description: str, category: str) -> str:
    prompt = f"""You are a cybersecurity professor creating educational content.

Explain the following vulnerability clearly for a student who just completed this challenge:

Title: {title}
Category: {category}
Description: {description}

Provide your response in this EXACT structured format:

**Why the vulnerability existed**
<A detailed 2-3 sentence explanation of the root cause>

**How the attack works**
<A clear, step-by-step conceptual breakdown of what happens internally. Mention techniques, NOT payloads.>

**Real-world impact**
<One or two sentences about why this is dangerous in production system/enterprise.>

**Prevention strategies**
<A list of 2-3 actionable fixes (e.g., input sanitization, using safe APIs, principles of least privilege)>

RULES:
- Do NOT reveal CTF flags.
- Do NOT provide exploit payloads or exact attack strings (e.g. no semicolons or system commands).
- Be extremely descriptive and helpful.
- Max 450 words."""

    return _call_groq(prompt, max_tokens=1000)

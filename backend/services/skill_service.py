"""
Skill Report Service — Groq (llama-3.3-70b-versatile)
Generates personalised skill gap analysis from user performance data.
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
_MODEL_NAME = "llama-3.3-70b-versatile"


def generate_skill_report(user_stats: dict) -> str:
    stats_text = "\n".join(f"- {k}: {v}" for k, v in user_stats.items())

    prompt = f"""You are a cybersecurity performance analyst reviewing a student's training data.

Student performance data:
{stats_text}

Generate a structured personal performance report with EXACTLY these 4 headings:

**Strong Skill Areas**
<list what the student is performing well in based on data>

**Weak Skill Areas**
<identify specific gaps — be precise, not generic>

**Recommended Focus Topics**
<list 2-3 specific topics to study next>

**Suggested Next Difficulty Level**
<Easy / Medium / Hard — with one sentence justification>

RULES:
- Be specific to the data provided — no generic advice.
- Avoid empty motivational phrases.
- Be direct and analytical.
- Max 300 words."""

    try:
        resp = _client.chat.completions.create(
            model=_MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=800,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Skill Service Error [{_MODEL_NAME}]: {e}")
        raise e

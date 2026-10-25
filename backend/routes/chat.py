from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from google import genai
import os

router = APIRouter(prefix="/user/chat", tags=["chat"])

# --- Configuration ---
<<<<<<< HEAD
# API key loaded securely from environment / backend/.env
API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_genai_client():
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        return None
    return genai.Client(api_key=key)
=======
# ideally this should be in .env, but user provided it directly
API_KEY = "AIzaSyBsbbKBW6OPZxud6hjUcOhmglnyyjPEDR8"
client = genai.Client(api_key=API_KEY)
>>>>>>> 45d12f71247f4a3f46d8185a27602c16e9749314

# Initialize Model
# Using 'gemini-2.5-flash' (Current stable version, higher rate limits)
MODEL_ID = 'gemini-2.5-flash'

# --- Data Models ---
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant" or "system"
    content: str
    timestamp: float = 0.0

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = None  # { "page": "challenges", "level": 10, "challenge_id": 5 }

class ChatResponse(BaseModel):
    content: str
    metadata: Optional[dict] = None

# --- System Prompt Construction ---
def build_system_prompt(context: dict) -> str:
    page = context.get("page", "dashboard")
    user_level = context.get("level", 1)
    # Challenge context if applicable
    challenge_info = ""
    if context.get("challenge_id"):
        challenge_info = f"User is currently attempting Challenge ID: {context.get('challenge_id')}."

    return f"""
    You are an elite cybersecurity mentor inside 'Hacker Portal'.
    Your mission is to train ethical hackers.
    
    Current User Context:
    - Current Page: {page}
    - User Level: {user_level}
    - {challenge_info}

    BEHAVIOR GUIDELINES:
    1. NEVER provide direct challenge flags (e.g., 'flag{{...}}') or full exploit scripts.
    2. Provide hints, guidance, and encouraging nudges.
    3. Explain vulnerabilities (SQLi, XSS, etc.) conceptually first, then give practical examples.
    4. Adapt difficulty: Level {user_level} users need { 'more basic' if user_level < 5 else 'advanced' } explanations.
    5. If the user asks for a flag, politely refuse and offer a hint instead.
    6. Use Markdown for formatting (bold, code blocks, bullet points).
    7. Keep responses concise and chatty, not like a textbook.
    
    If the user is on a 'Tutorial' page, offer to summarize or clarify concepts.
    If the user is on a 'Challenge' page, offer hints related to that specific challenge type (e.g. valid inputs for SQLi).
    """

# --- Endpoints ---

@router.post("/message", response_model=ChatResponse)
async def chat_with_mentor(request: ChatRequest):
    try:
        context = request.context or {}
        system_instruction = build_system_prompt(context)
        
        # Convert history format to Gemini format
        # Gemini expects: [{'role': 'user', 'parts': [{'text': '...'}]}, {'role': 'model', 'parts': [{'text': '...'}]}]
        gemini_history = []
        
        # Map roles: 'assistant' -> 'model', 'user' -> 'user'
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            gemini_history.append({"role": role, "parts": [{"text": msg.content}]})

        # The last message is the new user prompt
        last_message = request.messages[-1].content
        
        # If history is used, we need to be careful not to duplicate the last message if checking history
        # But here we construct a fresh request usually.
        # For simplicity in this stateless endpoint, we can just send the full history if we want context,
        # but `generate_content` is stateless.
        
        # Construct the full prompt context for stateless request
        # Or better, use the chat feature of the new SDK if we maintain history, 
        # but here we are stateless REST API so we likely reconstruct.
        
        # Correct approach for google-genai SDK stateless:
        # We can pass `contents` as a list of Content objects or dicts.
        
        # Let's format the contents list including the system instruction as a system implementation details
        # The new SDK supports `config` with `system_instruction`.
        
<<<<<<< HEAD
        client = get_genai_client()
        if not client:
            return ChatResponse(
                content="AI Mentor is offline: GEMINI_API_KEY is not configured in backend/.env."
            )

=======
>>>>>>> 45d12f71247f4a3f46d8185a27602c16e9749314
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=gemini_history,
            config={
                'system_instruction': system_instruction
            }
        )

        return ChatResponse(
            content=response.text,
            metadata={"processed": True, "model": MODEL_ID}
        )

    except Exception as e:
        print(f"Chat Error: {e}")
        # Return a fallback if API fails
        fallback = "I'm having trouble connecting to the neural network. (API Error)"
        
        # Check for specific errors
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
             fallback = "I'm overloaded right now (Rate Limit Reached). Please try again in a moment."
        elif "404" in error_str or "NOT_FOUND" in error_str:
             fallback = "My neural link is misconfigured (Model Not Found)."
        elif "API_KEY" in error_str:
             fallback = "Configuration Error: API Key invalid."
        elif "getaddrinfo failed" in error_str or "ConnectError" in error_str:
             fallback = "Network Error: Cannot reach Google AI servers. Check your internet connection."

             
        return ChatResponse( content=fallback )

@router.delete("/history")
async def clear_history():
    return {"status": "cleared"}


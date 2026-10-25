import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv(dotenv_path=r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal - till sandbox (strt)\ethical-hacking-portal\backend\.env")
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    output_path = r"c:\Users\LOQ\Desktop\MAIN PROJECT 2026\EHSP\ethical-hacking-portal (4)\ethical-hacking-portal - till sandbox (strt)\ethical-hacking-portal\available_models.json"
    with open(output_path, "w") as f:
        json.dump(models, f, indent=4)
    print(f"Success! Found {len(models)} models.")
except Exception as e:
    print(f"Error: {e}")

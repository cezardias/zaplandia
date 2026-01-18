from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Zaplandia AI Core")

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

class AIRequest(BaseModel):
    prompt: str
    system_instruction: str = "Você é o assistente virtual da Zaplandia, focado em ajudar clientes com automação e CRM. Seja cordial, direto e use emojis moderadamente."
    history: list = []

@app.get("/health")
def health():
    return {
        "status": "ready" if model else "missing_api_key",
        "model": "gemini-1.5-flash"
    }

@app.post("/v1/chat")
async def chat(request: AIRequest):
    if not model:
        return {"response": "AI Service is in bypass mode (No API Key). Received: " + request.prompt}
    
    try:
        # Simple implementation of system instruction via prompt prefix for flash
        full_prompt = f"{request.system_instruction}\n\nUsuário: {request.prompt}\nAssistente:"
        
        response = model.generate_content(full_prompt)
        return {
            "response": response.text,
            "tokens": len(response.text) // 4 # Mock token count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

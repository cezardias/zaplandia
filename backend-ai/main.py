from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Zaplandia AI Core - Multi-tenant")

# Configurações globais (fallback)
GLOBAL_GEMINI_KEY = os.getenv("GEMINI_API_KEY")

class AIRequest(BaseModel):
    prompt: str
    system_instruction: str = "Você é o assistente virtual da Zaplandia."
    api_key: str = None # Chave enviada dinamicamente por cliente

def get_gemini_model(api_key: str, system_instruction: str):
    """Configura e retorna o modelo com a chave específica do cliente ou global"""
    key_to_use = api_key if api_key else GLOBAL_GEMINI_KEY
    
    if not key_to_use:
        return None
    
    # Nota: No SDK da Google, genai.configure é global. 
    # Para suportar múltiplas chaves em paralelo, o ideal é passar a chave na criação do GenerativeModel
    # se o SDK suportar, ou instanciar um novo cliente.
    # No SDK atual, podemos passar api_key para configure ou usar instâncias de cliente se disponível.
    # Como o serviço é chamado sequencialmente/em workers, vamos re-configurar ou usar o objeto genai.
    
    genai.configure(api_key=key_to_use)
    
    generation_config = {
      "temperature": 1,
      "top_p": 0.95,
      "top_k": 40,
      "max_output_tokens": 8192,
    }

    safety_settings = {
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }

    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
        safety_settings=safety_settings,
        system_instruction=system_instruction
    )

@app.post("/v1/chat")
async def chat(request: AIRequest):
    model = get_gemini_model(request.api_key, request.system_instruction)
    
    if not model:
        return {"response": "[MODO DEMO - SEM CHAVE] Por favor, cadastre sua API Key no dashboard. Recebi: " + request.prompt}
    
    try:
        response = model.generate_content(request.prompt)
        
        if not response.text:
            return {"response": "A IA gerou uma resposta vazia ou foi bloqueada por filtros de segurança."}
            
        return {
            "response": response.text,
            "usage": str(response.usage_metadata) if hasattr(response, 'usage_metadata') else None
        }
    except Exception as e:
        print(f"Erro Gemini API: {str(e)}")
        # Se a chave do cliente for inválida, avisamos explicitamente
        if "API_KEY_INVALID" in str(e) or "403" in str(e):
            return {"response": "Sua chave de API do Gemini parece ser inválida. Por favor, verifique nas configurações."}
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "global_key_set": bool(GLOBAL_GEMINI_KEY)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

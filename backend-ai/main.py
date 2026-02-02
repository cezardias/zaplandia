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

    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro"
    ]
    
    # 1. First attempt with standard flash
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=system_instruction
        )
        return model
    except Exception as e:
        print(f"Erro inicial com gemini-1.5-flash: {str(e)}")

    # 2. Dynamic Discovery
    try:
        available_models = [m for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        print(f"Modelos reais disponíveis para esta chave: {[m.name for m in available_models]}")
        
        # Prefer flash, then pro
        for model_variant in ["flash", "pro"]:
            for m in available_models:
                if model_variant in m.name.lower():
                    print(f"Usando modelo descoberto dinamicamente: {m.name}")
                    return genai.GenerativeModel(
                        model_name=m.name,
                        generation_config=generation_config,
                        safety_settings=safety_settings,
                        system_instruction=system_instruction
                    )
        
        # Last resort: first available
        if available_models:
            print(f"Usando fallback final: {available_models[0].name}")
            return genai.GenerativeModel(
                model_name=available_models[0].name,
                generation_config=generation_config,
                safety_settings=safety_settings,
                system_instruction=system_instruction
            )
    except Exception as list_err:
        print(f"Erro crítico ao listar modelos: {str(list_err)}")
        
    return None

@app.post("/v1/chat")
async def chat(request: AIRequest):
    model = None
    try:
        model = get_gemini_model(request.api_key, request.system_instruction)
    except Exception as e:
        print(f"Falha total ao obter modelo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"[ERRO CRÍTICO IA] {str(e)}")
    
    if not model:
        return {"response": "[MODO DEMO - SEM CHAVE] Por favor, cadastre sua API Key no dashboard. Recebi: " + request.prompt}
    
    try:
        # Try SDK first
        response = model.generate_content(request.prompt)
        if response.text:
            return {
                "response": response.text,
                "usage": str(response.usage_metadata) if hasattr(response, 'usage_metadata') else None
            }
        else:
             return {"response": "A IA gerou uma resposta vazia ou foi bloqueada por filtros de segurança."}
    except Exception as e:
        error_msg = str(e)
        print(f"Erro Gemini SDK: {error_msg}")
        
        # 404 or "not found" -> Try REST Fallback as suggested by user
        if "404" in error_msg or "not found" in error_msg.lower():
            print("Tentando fallback via REST API...")
            import requests
            
            # Try latest models as suggested by user
            for model_name in ["gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-flash"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={request.api_key if request.api_key else GLOBAL_GEMINI_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": f"{request.system_instruction}\n\n{request.prompt}"}]}]
                }
                try:
                    res = requests.post(url, json=payload, timeout=30)
                    if res.status_code == 200:
                        data = res.json()
                        text = data['candidates'][0]['content']['parts'][0]['text']
                        print(f"Sucesso via REST com {model_name}!")
                        return {"response": text, "fallback": True, "model": model_name}
                except Exception as rest_e:
                    print(f"Falha no REST com {model_name}: {str(rest_e)}")
        
        # Se a chave do cliente for inválida, avisamos explicitamente
        if "API_KEY_INVALID" in error_msg or "403" in error_msg:
            return {"response": "Sua chave de API do Gemini parece ser inválida. Por favor, verifique nas configurações."}
        
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/health")
def health():
    return {"status": "ok", "global_key_set": bool(GLOBAL_GEMINI_KEY)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

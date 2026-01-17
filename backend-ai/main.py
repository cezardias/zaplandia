from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AIRequest(BaseModel):
    prompt: str
    context: dict = {}

@app.get("/")
def read_root():
    return {"status": "Zaplandia AI Service Online"}

@app.post("/generate")
def generate_response(request: AIRequest):
    # Log logic here
    return {"response": f"AI processed: {request.prompt}", "context_used": request.context}

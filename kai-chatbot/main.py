from fastapi import FastAPI
from pydantic import BaseModel
from rag_service import RAGService
from fastapi.middleware.cors import CORSMiddleware # Pastikan ini ada

# Inisialisasi aplikasi FastAPI
app = FastAPI(
    title="KAI GOAT Chatbot API",
    description="API untuk berinteraksi dengan chatbot RAG PT. KAI",
    version="1.0.0"
)

# Pastikan blok ini ada dan benar
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:5500", # Port dari browser Anda
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi layanan RAG.
rag_service = RAGService()

# Definisi model data
class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    answer: str

# Endpoints
@app.get("/", tags=["General"])
def read_root():
    return {"status": "KAI GOAT Chatbot API is running"}

@app.post("/ask", response_model=AnswerResponse, tags=["Chatbot"])
def ask_question(request: QuestionRequest):
    answer = rag_service.ask(request.question)
    return {"answer": answer}
import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings # <-- BARU
from langchain_chroma import Chroma # <-- BARU
from langchain_ollama import OllamaLLM # <-- BARU
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

# Lokasi database vektor yang akan disimpan
CHROMA_DB_PATH = "./chroma_db"


class RAGService:
    def __init__(self): 
        # Inisialisasi semua komponen saat objek dibuat
        self.llm = OllamaLLM(model="llama3:8b-instruct-q5_k_m")
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        if os.path.exists(CHROMA_DB_PATH):
            # Jika database sudah ada, langsung muat
            print("Memuat database vektor yang sudah ada...")
            self.vector_store = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=self.embeddings)
        else:
            # Jika tidak ada, buat baru dan simpan
            print("Membuat database vektor baru...")
            loader = DirectoryLoader('./data/', glob="**/*.txt", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            split_documents = text_splitter.split_documents(docs)
            self.vector_store = Chroma.from_documents(
                documents=split_documents,
                embedding=self.embeddings,
                persist_directory=CHROMA_DB_PATH
            )
        
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 3}) # Ambil 3 dokumen paling relevan
        self.prompt_template = self._create_prompt_template()
        self.retrieval_chain = self._create_retrieval_chain()
        print("Layanan RAG siap digunakan.")

    def _create_prompt_template(self):
        # Template prompt yang lebih detail dan "aman"
        return ChatPromptTemplate.from_template("""
Anda adalah asisten virtual "GOAT" dari PT. Kereta Api Indonesia yang profesional, akurat, dan ramah.
Tugas Anda adalah menjawab pertanyaan pengguna seputar layanan KAI.
Gunakan HANYA informasi dari konteks yang diberikan untuk menjawab pertanyaan.
JANGAN menggunakan pengetahuan eksternal Anda.

Jika informasi yang dibutuhkan tidak ada dalam konteks, jawab dengan sopan:
"Mohon maaf, saya belum memiliki informasi spesifik mengenai hal tersebut. Ada lagi yang bisa saya bantu?"

Konteks yang Relevan:
{context}

Pertanyaan Pengguna:
{input}

Jawaban Akurat Anda:
""")

    def _create_retrieval_chain(self):
        document_chain = create_stuff_documents_chain(self.llm, self.prompt_template)
        return create_retrieval_chain(self.retriever, document_chain)

    def ask(self, question: str):
        # Fungsi utama untuk menanyakan pertanyaan
        response = self.retrieval_chain.invoke({"input": question})
        return response["answer"]

# Untuk pengujian langsung file ini (opsional)
if __name__ == '__main__':
    rag_service = RAGService()
    answer = rag_service.ask("berapa persen biaya administrasi untuk pembatalan tiket?")
    print("\n--- HASIL JAWABAN ---")
    print(answer)
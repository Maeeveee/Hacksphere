import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.tools import Tool
from langchain.agents import create_react_agent, AgentExecutor
from tools import get_train_schedule # <-- Pastikan ini ada

CHROMA_DB_PATH = "./chroma_db"

class RAGService:
    def __init__(self):
        self.llm = OllamaLLM(model="llama3:8b-instruct-q5_k_m")
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

        if not os.path.exists(CHROMA_DB_PATH):
            self._create_and_persist_vector_store()
        
        self.vector_store = Chroma(persist_directory=CHROMA_DB_PATH, embedding_function=self.embeddings)
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        
        # Simpan RAG chain untuk digunakan di dalam tool
        self.rag_chain = self._setup_rag_chain()

        self.tools = self._setup_tools()
        
        # PERBAIKAN 1: Mengajari Agent kapan harus berhenti
        # GANTI TEMPLATE LAMA ANDA DENGAN YANG BARU INI
       # GANTI TEMPLATE LAMA ANDA DENGAN YANG BARU INI
        template = """
You are a helpful KAI assistant. Answer the following questions in Indonesian.

You have access to the following tools:

{tools}

Here are your instructions on how to format the final answer:
1.  When you have enough information from a tool, you MUST provide the final answer.
2.  If the user asks for a schedule, first present the schedule data from the 'Observation' in a clear, friendly list. Convert times to HH:MM format (e.g., 05:03).
3.  After the schedule list, you MUST create a dynamic booking link.
4.  The base URL is `http://localhost:3000/tickets`.
5.  Use the `origin`, `destination`, and `departureDate` (camelCase) from your `Action Input` to create the URL query parameters.
6.  **IMPORTANT**: For the origin and destination values, use the full station name as provided by the user, including the word "Stasiun" (e.g., `Stasiun+Gambir`, not `Gambir`).
7.  Add these static parameters: `&adults=1&children=0&isDifabel=false&isPulangPergi=false`.
8.  Format the link using Markdown, like this: `[Klik di sini untuk melanjutkan pemesanan](YOUR_URL)`.

Now, use the following format for your thought process:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action, as a valid JSON dictionary
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: [Your final, user-facing answer, formatted in Markdown according to the instructions above]

Begin!

Question: {input}
Thought:{agent_scratchpad}"""

        prompt = ChatPromptTemplate.from_template(template)
        
        agent = create_react_agent(self.llm, self.tools, prompt)
        
        self.agent_executor = AgentExecutor(
            agent=agent, 
            tools=self.tools, 
            verbose=True, 
            handle_parsing_errors=True
        )
        
        print("✅ Layanan Agent RAG siap digunakan.")
    
    def _setup_rag_chain(self):
        rag_prompt = ChatPromptTemplate.from_template("""
        Answer the user's question based ONLY on the following context:
        {context}
        Question: {input}
        """)
        document_chain = create_stuff_documents_chain(self.llm, rag_prompt)
        return create_retrieval_chain(self.retriever, document_chain)

    # PERBAIKAN 2: Membuat fungsi pembungkus untuk RAG tool
    def _run_rag_chain_wrapper(self, query: str) -> str:
        """Fungsi pembungkus untuk memastikan input ke RAG chain selalu benar."""
        response = self.rag_chain.invoke({"input": query})
        return response.get("answer", "Maaf, saya tidak menemukan jawaban di dokumen.")

    def _setup_tools(self):
        rag_tool = Tool(
            name="cari_informasi_kai",
            func=self._run_rag_chain_wrapper, # Gunakan fungsi pembungkus
            description="Gunakan tool ini untuk menjawab pertanyaan umum tentang layanan KAI, seperti kebijakan pembatalan, bagasi, atau informasi umum lainnya dari dokumen."
        )
        return [get_train_schedule, rag_tool]

    def _create_and_persist_vector_store(self):
        print("Membuat database vektor baru...")
        loader = DirectoryLoader('./data/', glob="**/*.txt", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        split_documents = text_splitter.split_documents(docs)
        Chroma.from_documents(
            documents=split_documents,
            embedding=self.embeddings,
            persist_directory=CHROMA_DB_PATH
        )

    def ask(self, question: str):
        response = self.agent_executor.invoke({"input": question})
        return response["output"]
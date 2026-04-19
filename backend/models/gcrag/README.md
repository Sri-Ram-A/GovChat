## 🚀 GC-RAG Microservice (Graph + Vector Hybrid RAG)

Implemented an end-to-end Graph-based Retrieval-Augmented Generation system.

### 🔧 Features
- PDF parsing using unstructured + pdfplumber fallback
- Entity and relation extraction using spaCy + REBEL
- Knowledge graph storage using Neo4j
- Graph traversal for semantic context retrieval
- Graph description generation + embedding (BGE model)
- Vector storage and search using Qdrant
- Hybrid retrieval (Graph + Vector)
- LLM integration (Groq) for answer generation

### 🧠 Architecture
PDF → Parser → Graph Extraction → Neo4j  
→ Embedding → Qdrant → Hybrid Retrieval → LLM → Answer

### ✅ Status
- End-to-end pipeline working
- Supports specific query answering
- No hallucination (fallback handled)

### 📌 Future Improvements
- Better ranking strategy
- Larger document coverage
- Context expansion for improved answers

### 🧪 Sample Query for the sample.pdf doc
What is the application fee for Commission Agent License?

### 💬 Response
The application fee for a Commission Agent License, also referred to as Grant Commision-Agent License in the context, is Rs.1000.


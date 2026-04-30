FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_lg

# Copy application code
COPY *.py .
COPY .env.example .env

# Environment variables
ENV NEO4J_URI=bolt://localhost:7687
ENV NEO4J_USER=neo4j
ENV NEO4J_PASSWORD=Srinidhi@39
ENV NEO4J_DATABASE=gcragdb
ENV QDRANT_URL=http://localhost:6333
ENV QDRANT_API_KEY=
ENV LLM_API_KEY=
ENV LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
ENV LLM_MODEL=llama-3.3-70b-versatile
ENV HF_HOME=/app/hf_cache
ENV TRANSFORMERS_CACHE=/app/hf_cache

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
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
ENV NEO4J_URI=block
ENV NEO4J_USER=neo4j
ENV NEO4J_PASSWORD=block
ENV NEO4J_DATABASE=neo4j

ENV QDRANT_URL=block
ENV QDRANT_API_KEY=block
ENV LLM_API_URL=block
ENV LLM_MODEL=llama-3.3-70b-versatile

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
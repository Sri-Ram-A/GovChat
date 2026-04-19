import os
os.environ["HF_HOME"] = "D:/hf_cache"

import tempfile
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from loguru import logger

from parser import parse_document
from extractor import extract_graph
from graph_store import store_graph, list_graphs as list_graphs_store, delete_graph as delete_graph_store
from embedder import embed_graph
from vector_store import upsert_embedding, delete_embedding
from retriever import retrieve_answer


class QueryRequest(BaseModel):
    question: str
    top_k: int = 3


class UploadMetadata(BaseModel):
    title: str = ""
    author: str = ""


app = FastAPI(title="GC-RAG Microservice", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    load_dotenv()
    logger.info("Loaded environment variables from .env")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("Health check requested")
    return {
        "status": "success",
        "data": {
            "message": "GC-RAG service is healthy",
            "version": "1.0.0"
        }
    }


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    author: str = Form(default="")
):
    """Upload a PDF file and run the full ingestion pipeline."""
    logger.info("Upload request received for file: {}", file.filename)

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    try:
        # Read file content
        content = await file.read()
        logger.info("File content read, size: {} bytes", len(content))

        # Save to temporary file for parsing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Step 1: Parse document
            logger.info("Parsing document")
            parsed = parse_document(tmp_path)

            # Step 2: Extract graph
            logger.info("Extracting graph")
            graph = extract_graph(parsed[:50])

            # Step 3: Store graph in Neo4j
            logger.info("Storing graph in Neo4j")
            graph_id = await store_graph({"sections": graph})

            # Step 4: Generate embedding
            logger.info("Generating embedding")
            embedding_result = embed_graph({"graph_id": graph_id, "sections": graph})

            # Step 5: Store embedding in Qdrant
            logger.info("Storing embedding in Qdrant")
            success = await upsert_embedding(
                graph_id,
                embedding_result["embedding"],
                {
                    "description": embedding_result["description"],
                    "title": title if title else "",
                    "author": author if author else "",
                    "filename": file.filename
                }
            )

            if not success:
                logger.error("Failed to store embedding for graph {}", graph_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to store embedding"
                )

            logger.info("Ingestion pipeline completed for graph {}", graph_id)
            return {
                "status": "success",
                "data": {
                    "graph_id": graph_id,
                    "message": "Document ingested successfully"
                }
            }

        finally:
            # Clean up temporary file
            os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )


@app.post("/query")
async def query_documents(request: QueryRequest):
    """Query the GC-RAG system."""
    logger.info("Query request: question='{}', top_k={}", request.question, request.top_k)

    try:
        result = await retrieve_answer(request.question, request.top_k)
        logger.info("Query completed successfully")
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error("Query failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


@app.get("/graphs")
async def list_all_graphs():
    """List all stored graphs."""
    logger.info("List graphs request")

    try:
        graphs = await list_graphs_store()
        logger.info("Listed {} graphs", len(graphs))
        return {
            "status": "success",
            "data": {
                "graphs": graphs,
                "count": len(graphs)
            }
        }
    except Exception as e:
        logger.error("List graphs failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list graphs: {str(e)}"
        )


@app.delete("/graphs/{graph_id}")
async def delete_specific_graph(graph_id: str):
    """Delete a specific graph."""
    logger.info("Delete graph request for {}", graph_id)

    try:
        # Delete from Neo4j
        success_neo4j = await delete_graph_store(graph_id)

        # Delete from Qdrant
        success_qdrant = await delete_embedding(graph_id)

        if success_qdrant:
            logger.info("Graph {} deleted successfully", graph_id)
            return {
                "status": "success",
                "data": {
                    "message": f"Graph {graph_id} deleted successfully"
                }
            }
        else:
            logger.warning("Partial deletion for graph {}: Neo4j={}, Qdrant={}", graph_id, success_neo4j, success_qdrant)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete graph from all stores"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Delete graph failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
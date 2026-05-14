import os
os.environ["HF_HOME"] = "D:/hf_cache/hub"
os.environ["TRANSFORMERS_CACHE"] = "D:/hf_cache/hub"

import tempfile
import uuid
import re
from typing import Dict, List, Optional

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from loguru import logger

from parser import parse_document
from extractor import extract_graph
from graph_store import (
    store_section_graph,
    get_section_graph,
    traverse_section_graph,
    list_all_section_graphs,
    delete_document_graphs,
    delete_section_graph,
)
from embedder import embed_section, embed_query
from vector_store import upsert_embedding, delete_embedding, search, list_all
from orchestrator import process_query


class QueryRequest(BaseModel):
    question: str
    top_k: int = 3


app = FastAPI(title="GC-RAG Per-Section Microservice", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    load_dotenv()
    logger.info("GC-RAG server started - per-section architecture")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "success",
        "message": "GC-RAG healthy"
    }


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    author: str = Form(default="")
):
    """
    Upload a PDF and process per-section.
    
    Pipeline:
    1. Parse document -> elements
    2. Extract sections from elements
    3. For each section:
       - Store in Neo4j as section graph
       - Generate embedding
       - Upsert to Qdrant vector store
    
    Returns: {document_id, sections_processed, section_graph_ids}
    """
    logger.info("Upload request received: file='{}', title='{}', author='{}'", 
                file.filename, title, author)

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    document_id = str(uuid.uuid4())
    logger.info("Generated document_id: {}", document_id)

    try:
        # Read file content
        content = await file.read()
        logger.info("File read: {} bytes", len(content))

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Step 1: Parse document
            logger.info("Parsing document from {}", tmp_path)
            parsed_elements = parse_document(tmp_path)
            logger.info("Parsed {} elements", len(parsed_elements))

            # Step 2: Extract graph (sections)
            logger.info("Extracting sections from elements")
            # filter out very short sections before processing
            meaningful = [e for e in parsed_elements if len(e.get("text", "").split()) > 1]
            sections = extract_graph(meaningful)
            logger.info("Extracted {} sections", len(sections))

            section_graph_ids = []

            # Step 3: Process each section
            for idx, section in enumerate(sections):
                try:
                    logger.info("Processing section {}/{}", idx + 1, len(sections))

                    # 3a. Store section in Neo4j
                    section_graph_id = await store_section_graph(section, document_id)
                    logger.debug("Stored section graph: {}", section_graph_id)

                    # 3b. Generate embedding
                    embedding_result = embed_section(section, section_graph_id)
                    logger.debug("Generated embedding for section {}", section_graph_id)

                    # 3c. Upsert embedding to Qdrant
                    metadata = {
                        "section_graph_id": section_graph_id,
                        "document_id": document_id,
                        "section_id": section.get("section_id", ""),
                        "title": title,
                        "author": author,
                        "filename": file.filename,
                        "description": embedding_result["description"]
                    }
                    success = await upsert_embedding(
                        section_graph_id,
                        embedding_result["embedding"],
                        metadata
                    )

                    if success:
                        section_graph_ids.append(section_graph_id)
                        logger.info("Section {}/{} processed successfully", idx + 1, len(sections))
                    else:
                        logger.warning("Failed to upsert embedding for section {}", section_graph_id)

                except Exception as e:
                    logger.error("Failed to process section {}: {}", idx, str(e))
                    continue

            logger.info("Upload completed: document_id={}, sections_processed={}", 
                       document_id, len(section_graph_ids))
            return {
                "document_id": document_id,
                "sections_processed": len(section_graph_ids),
                "section_graph_ids": section_graph_ids
            }

        finally:
            # Clean up temporary file
            os.unlink(tmp_path)
            logger.debug("Cleaned up temporary file")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


async def _call_llm(context: str, question: str) -> str:
    """
    Call LLM via Groq API with context and question.
    
    Returns:
        str: The LLM's answer
    """
    api_url = os.getenv("LLM_API_URL")
    api_key = os.getenv("LLM_API_KEY")
    model = os.getenv("LLM_MODEL", "mixtral-8x7b-32768")

    if not api_url or not api_key:
        logger.warning("LLM API credentials not configured, returning empty answer")
        return "LLM not configured"

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Use the provided context to answer the question accurately and concisely."
        },
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}"
        }
    ]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": model, "messages": messages},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            logger.info("LLM call successful, answer length: {}", len(answer))
            return answer
    except Exception as e:
        logger.error("LLM call failed: {}", str(e))
        return f"Error calling LLM: {str(e)}"


def _extract_keywords(text: str, max_keywords: int = 5) -> List[str]:
    """Extract keywords from text for graph traversal."""
    # Simple keyword extraction: remove common words, split on whitespace
    stop_words = {"a", "an", "the", "is", "are", "was", "were", "be", "do", "does", "did", "and", "or", "but", "in", "of", "to", "for", "with", "from", "by", "on", "at"}
    words = re.findall(r'\b\w+\b', text.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    return list(dict.fromkeys(keywords))[:max_keywords]  # Unique, limit to max_keywords


# @app.post("/query")
# async def query_documents(request: QueryRequest):
#     """
#     Query the GC-RAG system with per-section retrieval.
    
#     Pipeline:
#     1. Embed query
#     2. Search top_k sections in Qdrant
#     3. Traverse each section graph for context
#     4. Merge contexts
#     5. Call LLM with merged context
    
#     Returns: {answer, graphs_used, confidence}
#     """
#     logger.info("Query request: question='{}', top_k={}", request.question, request.top_k)

#     try:
#         # Step 1: Embed query
#         logger.info("Embedding query")
#         query_embedding = embed_query(request.question)
#         logger.debug("Query embedded, dimension: {}", len(query_embedding))

#         # Step 2: Search in Qdrant
#         logger.info("Searching Qdrant for top {} sections", request.top_k)
#         hits = await search(query_embedding, top_k=request.top_k)
#         logger.info("Found {} hits", len(hits))

#         if not hits:
#             logger.warning("No relevant sections found")
#             return {
#                 "answer": "No relevant information found in the knowledge base.",
#                 "graphs_used": [],
#                 "confidence": 0.0
#             }

#         # Step 3: Extract keywords for graph traversal
#         keywords = _extract_keywords(request.question)
#         logger.debug("Extracted keywords: {}", keywords)

#         # Step 4: Traverse each section graph and collect context
#         context_parts = []
#         graphs_used = []

#         for idx, hit in enumerate(hits):
#             try:
#                 section_graph_id = hit.get("graph_id") or hit.get("metadata", {}).get("section_graph_id")
#                 metadata = hit.get("metadata", {})
#                 score = hit.get("score", 0.0)

#                 logger.debug("Processing hit {}/{}: section_graph_id={}, score={}", 
#                             idx + 1, len(hits), section_graph_id, score)

#                 # Traverse the section graph for context
#                 context = await traverse_section_graph(section_graph_id, keywords)
#                 context_parts.append(context)

#                 graphs_used.append({
#                     "section_graph_id": section_graph_id,
#                     "document_id": metadata.get("document_id", ""),
#                     "section_id": metadata.get("section_id", ""),
#                     "title": metadata.get("title", ""),
#                     "score": score
#                 })

#                 logger.debug("Context retrieved for section {}", section_graph_id)

#             except Exception as e:
#                 logger.error("Failed to process hit {}: {}", section_graph_id, str(e))
#                 continue

#         if not context_parts:
#             logger.warning("No context could be retrieved from sections")
#             return {
#                 "answer": "Failed to retrieve context from relevant sections.",
#                 "graphs_used": graphs_used,
#                 "confidence": 0.0
#             }

#         # Step 5: Merge contexts
#         merged_context = "\n---\n".join(context_parts)
#         logger.info("Merged context from {} sections, total length: {}", 
#                    len(context_parts), len(merged_context))
        
#         logger.info("Context being sent to LLM: {}", merged_context[:800])

#         # Step 6: Call LLM
#         logger.info("Calling LLM with merged context")
#         answer = await _call_llm(merged_context, request.question)

#         # Step 7: Calculate confidence (simple heuristic based on score)
#         avg_confidence = sum(g["score"] for g in graphs_used) / len(graphs_used) if graphs_used else 0.0
#         logger.info("Query completed, confidence: {}", avg_confidence)

#         return {
#             "answer": answer,
#             "graphs_used": graphs_used,
#             "confidence": avg_confidence
#         }

#     except Exception as e:
#         logger.error("Query failed: {}", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Query failed: {str(e)}"
#         )

@app.post("/query")
async def query_documents(request: QueryRequest):
    logger.info("Query request: question='{}', top_k={}", request.question, request.top_k)

    try:
        # Step 1: Use orchestrator for smart routing only
        from orchestrator import route_query, QueryState
        state: QueryState = {
            "question": request.question,
            "query_type": "simple",
            "top_k": request.top_k,
            "context": "", "answer": "",
            "graphs_used": [], "confidence": 0.0,
            "needs_clarification": False,
            "clarification_message": ""
        }
        state = await route_query(state)

        # Step 2: Handle unclear queries immediately
        if state["query_type"] == "unclear":
            return {
                "answer": "Your question is unclear. Could you specify which service or scheme you're asking about?",
                "query_type": "unclear",
                "graphs_used": [],
                "confidence": 0.0
            }

        # Step 3: Use smart top_k from orchestrator
        smart_top_k = state["top_k"]
        logger.info("Query type: {}, using top_k: {}", state["query_type"], smart_top_k)

        # Step 4: Original proven pipeline (unchanged)
        query_embedding = embed_query(request.question)
        hits = await search(query_embedding, top_k=smart_top_k)

        if not hits:
            return {"answer": "No relevant information found.", "graphs_used": [], "confidence": 0.0}

        keywords = _extract_keywords(request.question)
        context_parts = []
        graphs_used = []

        for idx, hit in enumerate(hits):
            try:
                section_graph_id = hit.get("graph_id") or hit.get("metadata", {}).get("section_graph_id")
                metadata = hit.get("metadata", {})
                score = hit.get("score", 0.0)
                context = await traverse_section_graph(section_graph_id, keywords)
                context_parts.append(context)
                graphs_used.append({
                    "section_graph_id": section_graph_id,
                    "document_id": metadata.get("document_id", ""),
                    "section_id": metadata.get("section_id", ""),
                    "title": metadata.get("title", ""),
                    "score": score
                })
            except Exception as e:
                logger.error("Failed to process hit {}: {}", section_graph_id, e)
                continue

        merged_context = "\n---\n".join(context_parts)
        answer = await _call_llm(merged_context, request.question)
        avg_confidence = sum(g["score"] for g in graphs_used) / len(graphs_used) if graphs_used else 0.0

        return {
            "answer": answer,
            "query_type": state["query_type"],
            "graphs_used": graphs_used,
            "confidence": avg_confidence
        }

    except Exception as e:
        logger.error("Query failed: {}", str(e))
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/graphs")
async def list_all_graphs():
    """
    List all section graphs grouped by document_id.
    
    Returns: {documents: [{document_id, section_count, sections: [...]}]}
    """
    logger.info("List graphs request")

    try:
        # Get all section graphs
        all_sections = await list_all_section_graphs()
        logger.info("Retrieved {} total sections", len(all_sections))

        # Group by document_id
        documents = {}
        for section in all_sections:
            doc_id = section.get("document_id", "unknown")
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "sections": []
                }
            documents[doc_id]["sections"].append(section)

        # Add section_count
        result_docs = [
            {
                **doc_info,
                "section_count": len(doc_info["sections"])
            }
            for doc_info in documents.values()
        ]

        logger.info("Grouped into {} documents", len(result_docs))
        return {
            "documents": result_docs
        }

    except Exception as e:
        logger.error("List graphs failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list graphs: {str(e)}"
        )


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete all section graphs and embeddings for a document.
    
    Returns: {deleted_sections: int}
    """
    logger.info("Delete request for document: {}", document_id)

    try:
        # Get all section graphs for this document
        section_graphs = await list_all_section_graphs(document_id=document_id)
        section_graph_ids = [sg["section_graph_id"] for sg in section_graphs]
        logger.info("Found {} sections for document {}", len(section_graph_ids), document_id)

        # Delete from Qdrant
        for section_graph_id in section_graph_ids:
            try:
                await delete_embedding(section_graph_id)
                logger.debug("Deleted embedding for section {}", section_graph_id)
            except Exception as e:
                logger.warning("Failed to delete embedding for section {}: {}", 
                              section_graph_id, str(e))

        # Delete from Neo4j
        deleted_count = await delete_document_graphs(document_id)
        logger.info("Deleted {} sections from Neo4j for document {}", deleted_count, document_id)

        return {
            "deleted_sections": deleted_count
        }

    except Exception as e:
        logger.error("Delete document failed: {}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )


@app.get("/documents/{document_id}/status")
async def document_status(document_id: str):
    """
    Return current indexing status for a document.

    Returns: {document_id, status, sections_indexed}
    """
    logger.info("Status request for document: {}", document_id)
    try:
        section_graphs = await list_all_section_graphs(document_id=document_id)
        sections_indexed = len(section_graphs)
        status_text = "ready" if sections_indexed > 0 else "processing"

        return {
            "document_id": document_id,
            "status": status_text,
            "sections_indexed": sections_indexed,
        }
    except Exception as e:
        logger.error("Status lookup failed for {}: {}", document_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status lookup failed: {str(e)}"
        )
    

@app.get("/documents")
async def list_documents():
    """List all documents with metadata."""
    try:
        sections = await list_all_section_graphs()
        
        # group by document_id
        documents = {}
        for section in sections:
            doc_id = section.get("document_id")
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "section_count": 0,
                    "sections": []
                }
            documents[doc_id]["section_count"] += 1
            documents[doc_id]["sections"].append(section.get("section_id"))
        
        # enrich with Qdrant metadata (filename, title)
        embeddings = await list_all()
        for emb in embeddings:
            doc_id = emb["metadata"].get("document_id")
            if doc_id in documents:
                documents[doc_id]["filename"] = emb["metadata"].get("filename", "")
                documents[doc_id]["title"] = emb["metadata"].get("title", "")

        return {
            "status": "success",
            "documents": list(documents.values()),
            "total": len(documents)
        }
    except Exception as e:
        logger.error("List documents failed: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
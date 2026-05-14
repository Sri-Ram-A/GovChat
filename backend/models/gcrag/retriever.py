import os
import re
import asyncio
from typing import Dict, List, Any

import httpx
from loguru import logger

from embedder import load_model
from graph_store import get_section_graph, traverse_section_graph
from vector_store import search as qdrant_search


LLM_API_URL = os.getenv("LLM_API_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY2")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = (
    "You are a Graph-RAG assistant. Use the provided graph context to answer the question precisely. "
    "If the answer is not contained in the context, say you don't know."
)

STOP_WORDS = {
    "the", "is", "at", "which", "on", "for", "and", "or", "a", "an", 
    "of", "to", "in", "that", "it", "what", "are", "how", "why", 
    "when", "where", "who", "does", "do", "was", "were"
}


def _extract_query_keywords(question: str, max_keywords: int = 8) -> List[str]:
    tokens = re.findall(r"[A-Za-z0-9]+", question.lower())
    keywords = [token for token in tokens if token not in STOP_WORDS and len(token) > 2]
    unique = []
    for token in keywords:
        if token not in unique:
            unique.append(token)
        if len(unique) >= max_keywords:
            break
    return unique or [question]


async def _embed_question(question: str) -> List[float]:
    logger.info("Embedding question for retrieval")
    model = load_model()
    embedding = model.encode(question).tolist()
    logger.info("Question embedding generated with dimension {}", len(embedding))
    return embedding


async def _call_llm(prompt: str) -> str:
    # Gemini API
    # if "generativelanguage.googleapis.com" in (LLM_API_URL or ""):
    #     async with httpx.AsyncClient(timeout=30.0) as client:
    #         gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={LLM_API_KEY}"
    #         payload = {
    #         "contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\n" + prompt}]}],
    #         "generationConfig": {"temperature": 0.2, "maxOutputTokens": 512}
    #         }
    #         logger.info("Calling Gemini API")
    #         response = await client.post(gemini_url, json=payload)
    #         response.raise_for_status()
    #         result = response.json()
    #         return result["candidates"][0]["content"]["parts"][0]["text"].strip()
        
    if not LLM_API_URL or not LLM_API_KEY:
        message = "LLM_API_URL and LLM_API_KEY must be configured to call the language model."
        logger.error(message)
        raise RuntimeError(message)

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        payload: Dict[str, Any]
        if "chat/completions" in LLM_API_URL or "/v1/chat/completions" in LLM_API_URL:
            payload = {
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 512,
            }
        elif "/v1/responses" in LLM_API_URL:
            payload = {
                "model": LLM_MODEL,
                "input": prompt,
                "temperature": 0.2,
                "max_output_tokens": 512,
            }
        else:
            payload = {
                "model": LLM_MODEL,
                "prompt": prompt,
                "temperature": 0.2,
                "max_tokens": 512,
            }

        logger.info("Calling LLM at {}", LLM_API_URL)
        response = await client.post(LLM_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()

    logger.info("LLM response received")

    if "choices" in result and result["choices"]:
        choice = result["choices"][0]
        if "message" in choice:
            return choice["message"].get("content", "").strip()
        return choice.get("text", "").strip()

    if "output" in result and result["output"]:
        first = result["output"][0]
        if isinstance(first, dict) and "content" in first:
            return first["content"].strip()
        return str(first).strip()

    return str(result).strip()


async def _build_context(graph_id: str, keywords: List[str]) -> str:
    logger.info("Fetching and traversing graph {}", graph_id)
    traversal = await traverse_section_graph(graph_id, keywords)
    return traversal


async def _retrieve_answer_async(question: str, top_k: int = 3) -> Dict[str, Any]:
    logger.info("Starting retrieval pipeline for question: {}", question)
    query_embedding = await _embed_question(question)
    raw_results = await qdrant_search(query_embedding, top_k)
    graph_ids = [hit["graph_id"] for hit in raw_results]

    if not graph_ids:
        logger.warning("No graphs found for question")
        return {
            "answer": "I could not find any relevant graph information to answer that question.",
            "graphs_used": [],
            "confidence": 0.0,
        }

    keywords = _extract_query_keywords(question)
    logger.info("Extracted keywords: {}", keywords)

    context_blocks = []
    graphs_used: List[str] = []
    for graph_id in graph_ids:
        try:
            context = await _build_context(graph_id, keywords)
            if context:
                context_blocks.append(context)
                graphs_used.append(graph_id)
        except Exception as e:
            logger.error("Failed to build context for graph {}: {}", graph_id, e)

    merged_context = "\n\n---\n\n".join(context_blocks)
    logger.info("Merged context length: {} characters", len(merged_context))

    prompt = (
        f"Use the following graph context to answer the question. Prefer exact wording from Source text. "
        f"Do not omit numeric criteria such as ages, date ranges, fees, income limits, percentages, or deadlines. "
        f"If the answer cannot be found, say so.\n\n"
        f"Context:\n{merged_context}\n\nQuestion: {question}\nAnswer:"
    )

    try:
        answer = await _call_llm(prompt)
    except Exception as e:
        logger.error("LLM call failed: {}", e)
        return {
            "answer": "The language model request failed.",
            "graphs_used": graphs_used,
            "confidence": 0.0,
        }

    scores = [min(max(hit.get("score", 0.0), 0.0), 1.0) for hit in raw_results]
    confidence = float(sum(scores) / len(scores)) if scores else 0.0

    logger.info("Retrieval pipeline completed with confidence {}", confidence)
    return {
        "answer": answer,
        "graphs_used": graphs_used,
        "confidence": confidence,
    }


def retrieve_answer(question: str, top_k: int = 3) -> Dict[str, Any]:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(_retrieve_answer_async(question, top_k))

    if loop.is_running():
        raise RuntimeError("retrieve_answer cannot be called from an active event loop; use the async pipeline directly.")

    return asyncio.run(_retrieve_answer_async(question, top_k))


async def retrieve_answer(question: str, top_k: int = 3) -> Dict[str, Any]:
    return await _retrieve_answer_async(question, top_k)

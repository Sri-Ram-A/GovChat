import os
import asyncio
import httpx
from typing import TypedDict, Literal, List
from loguru import logger
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from retriever import _retrieve_answer_async

load_dotenv()

GROQ_API_KEY = os.getenv("LLM_API_KEY")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"
GCRAG_URL = os.getenv("GCRAG_URL", "http://localhost:8001")


# -------- STATE --------

class QueryState(TypedDict):
    question: str
    query_type: Literal["simple", "multi_topic", "listing", "unclear"]
    top_k: int
    context: str
    answer: str
    graphs_used: List[str]
    confidence: float
    needs_clarification: bool
    clarification_message: str


# -------- NODES --------

async def route_query(state: QueryState) -> QueryState:
    """
    Classify the query type using Groq.
    """
    logger.info("[Orchestrator] Routing query: {}", state["question"][:80])

    prompt = f"""Classify this query into exactly one category:
- simple: asking about one specific fact (fee, deadline, eligibility for one service)
- multi_topic: asking about multiple services or comparing things
- listing: asking to list/enumerate all items in a category
- unclear: too vague to answer

Query: "{state['question']}"

Respond with ONLY one word: simple, multi_topic, listing, or unclear"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a query classifier. Respond with exactly one word."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.0,
        "max_tokens": 10
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)
            resp.raise_for_status()
            result = resp.json()["choices"][0]["message"]["content"].strip().lower()
            
            if result not in ["simple", "multi_topic", "listing", "unclear"]:
                result = "simple"
            
            logger.info("[Orchestrator] Query classified as: {}", result)
            state["query_type"] = result

            # set top_k based on type
            if result == "simple":
                state["top_k"] = 2
            elif result == "multi_topic":
                state["top_k"] = 5
            elif result == "listing":
                state["top_k"] = 10
            else:
                state["top_k"] = 3

    except Exception as e:
        logger.error("[Orchestrator] Routing failed: {}", e)
        state["query_type"] = "simple"
        state["top_k"] = 3

    return state


# async def retrieve_context(state: QueryState) -> QueryState:
#     """
#     Call GC-RAG /query endpoint with appropriate top_k.
#     """
#     if state.get("needs_clarification"):
#         return state

#     logger.info("[Orchestrator] Retrieving context, top_k={}", state["top_k"])

#     try:
#         async with httpx.AsyncClient(timeout=60.0) as client:
#             resp = await client.post(
#                 f"{GCRAG_URL}/query",
#                 json={
#                     "question": state["question"],
#                     "top_k": state["top_k"]
#                 }
#             )
#             resp.raise_for_status()
#             data = resp.json()

#             state["answer"] = data.get("answer", "")
#             state["graphs_used"] = [
#                 g.get("section_graph_id", "") 
#                 for g in data.get("graphs_used", [])
#             ]
#             state["confidence"] = data.get("confidence", 0.0)
#             state["context"] = f"Answer retrieved with confidence {state['confidence']:.2f}"

#             logger.info("[Orchestrator] Retrieved answer, confidence={:.2f}", state["confidence"])

#     except Exception as e:
#         logger.error("[Orchestrator] Retrieval failed: {}", e)
#         state["answer"] = "I encountered an error retrieving information."
#         state["confidence"] = 0.0

#     return state



async def retrieve_context(state: QueryState) -> QueryState:
    if state.get("needs_clarification"):
        return state

    logger.info("[Orchestrator] Retrieving context, top_k={}", state["top_k"])

    try:
        result = await _retrieve_answer_async(state["question"], state["top_k"])
        # for listing queries, re-call LLM with better prompt if answer is weak
        if state["query_type"] == "listing" and "does not explicitly" in result.get("answer", ""):
            from retriever import _embed_question, _call_llm
            from vector_store import search as qdrant_search
            
            query_embedding = await _embed_question(state["question"])
            hits = await qdrant_search(query_embedding, top_k=10)
            
            # extract descriptions from metadata as listing context
            descriptions = []
            for hit in hits:
                desc = hit.get("metadata", {}).get("description", "")
                if desc:
                    descriptions.append(desc)
            
            listing_context = "\n".join(descriptions)
            listing_prompt = (
                f"Based on these document section descriptions, list all the services/applications mentioned:\n\n"
                f"{listing_context}\n\n"
                f"Question: {state['question']}\n"
                f"Provide a complete numbered list of all services/applications found:"
            )
            
            better_answer = await _call_llm(listing_prompt)
            state["answer"] = better_answer
        state["answer"] = result.get("answer", "")
        state["graphs_used"] = result.get("graphs_used", [])
        state["confidence"] = result.get("confidence", 0.0)
        logger.info("[Orchestrator] Retrieved answer, confidence={:.2f}", state["confidence"])
    except Exception as e:
        logger.error("[Orchestrator] Retrieval failed: {}", e)
        state["answer"] = "I encountered an error retrieving information."
        state["confidence"] = 0.0

    return state







async def handle_unclear(state: QueryState) -> QueryState:
    """
    Generate a clarification request for unclear queries.
    """
    logger.info("[Orchestrator] Handling unclear query")

    state["needs_clarification"] = True
    state["clarification_message"] = (
        "Your question is a bit unclear. Could you please specify:\n"
        "- Which specific service or scheme are you asking about?\n"
        "- What information do you need (fee, deadline, eligibility, documents)?"
    )
    state["answer"] = state["clarification_message"]
    state["confidence"] = 0.0

    return state


async def validate_answer(state: QueryState) -> QueryState:
    """
    Check if the answer is useful or if we need to retry with more context.
    """
    answer = state.get("answer", "")
    confidence = state.get("confidence", 0.0)

    dont_know_phrases = [
        "i don't know", "i do not know", "cannot determine",
        "not found", "no information", "cannot be determined",
        "does not contain", "not explicitly"
    ]

    is_unhelpful = any(phrase in answer.lower() for phrase in dont_know_phrases)

    if is_unhelpful and confidence < 0.5 and state["top_k"] < 10:
        logger.info("[Orchestrator] Answer unhelpful, retrying with higher top_k")
        state["top_k"] = min(state["top_k"] * 2, 10)
        # retry retrieval
        state = await retrieve_context(state)

    return state


# -------- ROUTING FUNCTIONS --------

def should_clarify(state: QueryState) -> str:
    if state.get("query_type") == "unclear":
        return "clarify"
    return "retrieve"


# -------- BUILD GRAPH --------

def build_orchestrator():
    graph = StateGraph(QueryState)

    # add nodes
    graph.add_node("router", route_query)
    graph.add_node("retrieve", retrieve_context)
    graph.add_node("clarify", handle_unclear)
    graph.add_node("validate", validate_answer)

    # set entry point
    graph.set_entry_point("router")

    # add edges
    graph.add_conditional_edges(
        "router",
        should_clarify,
        {
            "clarify": "clarify",
            "retrieve": "retrieve"
        }
    )
    graph.add_edge("retrieve", "validate")
    graph.add_edge("validate", END)
    graph.add_edge("clarify", END)

    return graph.compile()


# -------- PUBLIC API --------

orchestrator = build_orchestrator()


async def process_query(question: str) -> dict:
    """
    Main entry point for orchestrated query processing.
    """
    logger.info("[Orchestrator] Processing query: {}", question[:80])

    initial_state: QueryState = {
        "question": question,
        "query_type": "simple",
        "top_k": 3,
        "context": "",
        "answer": "",
        "graphs_used": [],
        "confidence": 0.0,
        "needs_clarification": False,
        "clarification_message": ""
    }

    result = await orchestrator.ainvoke(initial_state)

    return {
        "answer": result["answer"],
        "query_type": result["query_type"],
        "graphs_used": result["graphs_used"],
        "confidence": result["confidence"],
        "needs_clarification": result.get("needs_clarification", False)
    }


def process_query_sync(question: str) -> dict:
    """
    Sync wrapper for use in non-async contexts.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(lambda: asyncio.run(process_query(question)))
            return future.result(timeout=120)
    else:
        return asyncio.run(process_query(question))
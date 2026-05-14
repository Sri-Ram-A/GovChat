import os
import asyncio
import json
from typing import List, Dict

import httpx
from dotenv import load_dotenv
from loguru import logger

# Load environment variables from .env file
load_dotenv()

# Groq configuration
GROQ_API_KEY = os.getenv("LLM_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY environment variable not set")


def chunk_elements(elements: List[Dict]) -> List[Dict]:
    import re
    logger.info("Chunking {} elements into logical chunks", len(elements))

    FIELD_LABELS = {
        "eligibility", "supporting document", "application fee",
        "service charge", "delivery time", "procedure for applying",
    }

    def is_field_label(t: str) -> bool:
        t = t.lower().strip().rstrip(":")
        return (t in FIELD_LABELS or
                t.startswith("eligibility") or
                t.startswith("supporting doc") or
                t.startswith("application fee") or
                t.startswith("service charge") or
                t.startswith("delivery time") or
                t.startswith("procedure for"))

    def is_service_title(t: str) -> bool:
        t_stripped = t.strip()
        t_lower = t_stripped.lower()
        
        # exclude procedure steps
        if any(t_lower.startswith(kw) for kw in [
            "applicant will", "department will", "once reviewed", 
            "once processed", "applicant submit"
        ]):
            return False
        
        # exclude if it contains only "applicant" actions
        if "will submit" in t_lower or "will review" in t_lower or "will receive" in t_lower:
            return False
        
        # valid service title: starts with number+dot OR "department:"
        return (bool(re.match(r'^\d+\.', t_stripped)) or
                t_lower.startswith("department:"))

    chunks = []
    current_chunk = None
    chunk_counter = 0

    for element in elements:
        element_type = element.get("element_type", "").strip().lower()
        text = element.get("text", "").strip()
        page_number = element.get("page_number", 0)

        if element_type == "title":
            logger.debug("Title: '{}' | field={} | service={}",
                        text[:60], is_field_label(text), is_service_title(text))

            if is_field_label(text):
                if current_chunk:
                    current_chunk["elements"].append(element)
                    current_chunk["raw_text"] += "\n" + text

            elif is_service_title(text) or current_chunk is None:
                if current_chunk and current_chunk.get("elements"):
                    chunks.append(current_chunk)
                chunk_counter += 1
                current_chunk = {
                    "chunk_id": f"chunk_{chunk_counter}",
                    "title": text,
                    "elements": [element],
                    "raw_text": text,
                    "page_number": page_number,
                }
            else:
                if current_chunk:
                    current_chunk["elements"].append(element)
                    current_chunk["raw_text"] += "\n" + text

        elif element_type in ["narrativetext", "listitem", "text"]:
            # check if this listitem is actually a service name (e.g. "1. Application To Grant...")
            procedure_keywords = ["applicant will", "department will", "once reviewed", 
                      "once processed", "will submit", "will review", "will receive"]
            is_procedure = any(text.lower().startswith(kw) or kw in text.lower() 
                   for kw in procedure_keywords)

            if element_type == "listitem" and re.match(r'^\d+\.', text.strip()) and not is_procedure:
                # start new chunk for this service
                if current_chunk and current_chunk.get("elements"):
                    chunks.append(current_chunk)
                chunk_counter += 1
                current_chunk = {
                    "chunk_id": f"chunk_{chunk_counter}",
                    "title": text,
                    "elements": [element],
                    "raw_text": text,
                    "page_number": page_number,
                }
            elif current_chunk is not None:
                current_chunk["elements"].append(element)
                current_chunk["raw_text"] += "\n" + text
            else:
                chunk_counter += 1
                current_chunk = {
                    "chunk_id": f"chunk_{chunk_counter}",
                    "title": f"Untitled {chunk_counter}",
                    "elements": [element],
                    "raw_text": text,
                    "page_number": page_number,
                }

    if current_chunk and current_chunk.get("elements"):
        chunks.append(current_chunk)

    logger.info("Created {} chunks from {} elements", len(chunks), len(elements))
    return chunks


async def call_groq_api(chunk_raw_text: str) -> Dict:
    """
    Call Groq API to extract entities and relations from text.
    
    Args:
        chunk_raw_text: The raw text to extract from
    
    Returns:
        Dictionary with keys: entities (list), relations (list)
    """
    system_prompt = (
        "You are a knowledge graph extractor. Extract entities and relations from the given text. "
        "Return ONLY valid JSON, no markdown, no explanation."
    )

    user_prompt = f"""Extract entities and relations from this text and return JSON in this exact format:
{{
  "entities": [
    {{"id": "e1", "label": "CONCEPT", "name": "entity name"}}
  ],
  "relations": [
    {{"from": "entity name", "type": "relation type", "to": "entity name"}}
  ]
}}

Labels must be one of: CONCEPT, ORG, PERSON, DATE, MONEY, LAW, PRODUCT, LOCATION
Relation types should be snake_case like: has_fee, requires_document, managed_by, has_eligibility, has_deadline, part_of, subclass_of

Text:
{chunk_raw_text}"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Extract the content from the response
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            logger.debug("Groq response: {}", content[:200])

            # Parse JSON from content
            try:
                # Try to extract JSON from the response
                cleaned = content.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("```")[1]
                    if cleaned.startswith("json"):
                         cleaned = cleaned[4:]
                cleaned = cleaned.strip()
                result = json.loads(cleaned)
                entities = result.get("entities", [])
                relations = result.get("relations", [])
                logger.debug("Extracted {} entities and {} relations", len(entities), len(relations))
                return {"entities": entities, "relations": relations}
            except json.JSONDecodeError as e:
                logger.warning("Failed to parse Groq JSON response: {}", e)
                return {"entities": [], "relations": []}

        except Exception as e:
            logger.error("Error calling Groq API: {}", e)
            return {"entities": [], "relations": []}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("Rate limited by Groq, waiting 10 seconds...")
                await asyncio.sleep(10)
                # retry once
                response = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
            else:
                logger.error("Groq API error: {} {}", e.response.status_code, e.response.text)
                return {"entities": [], "relations": []}


async def extract_graph_async(chunks: List[Dict]) -> List[Dict]:
    """
    Async function to extract graph data from chunks using Groq LLM.
    
    Args:
        chunks: list of chunks from chunk_elements()
    
    Returns:
        list of extraction results with keys: section_id, entities, relations, raw_text
    """
    results = []
    total_chunks = len(chunks)

    for idx, chunk in enumerate(chunks):
        logger.info("Processing chunk {}/{}: {}", idx + 1, total_chunks, chunk["chunk_id"])

        chunk_id = chunk["chunk_id"]
        raw_text = chunk["raw_text"].strip()

        if not raw_text:
            logger.warning("Skipping empty chunk: {}", chunk_id)
            results.append({
                "section_id": chunk_id,
                "entities": [],
                "relations": [],
                "raw_text": "",
            })
            continue

        # Call Groq API
        extraction = await call_groq_api(raw_text)

        results.append({
            "section_id": chunk_id,
            "entities": extraction.get("entities", []),
            "relations": extraction.get("relations", []),
            "raw_text": raw_text,
        })

        # Rate limiting: sleep 0.5 seconds between Groq calls
        if idx < total_chunks - 1:
            await asyncio.sleep(2)

    logger.info("Completed extraction for {} chunks", len(results))
    return results


def extract_graph(elements: List[Dict]) -> List[Dict]:
    """
    Main function to extract knowledge graph from document elements.
    
    This is a synchronous function that internally uses asyncio.run() for
    async Groq API calls. It orchestrates the full extraction pipeline:
    1. Chunk elements into logical sections
    2. For each chunk, call Groq LLM to extract entities and relations
    
    Args:
        elements: list of parsed elements from parser.py [{page_number, element_type, text}]
    
    Returns:
        list of extraction results with keys: section_id, entities, relations, raw_text
    """
    logger.info("Starting knowledge graph extraction for {} elements", len(elements))

    # Step 1: Chunk elements into logical sections
    chunks = chunk_elements(elements)

    # Step 2: Extract graph data from chunks using Groq (async)
# Step 2: Extract graph data from chunks using Groq (async)
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We're inside FastAPI - run in a separate thread with its own event loop
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(lambda: asyncio.run(extract_graph_async(chunks)))
            results = future.result(timeout=300)  # 5 min timeout
    else:
        results = asyncio.run(extract_graph_async(chunks))

    logger.info("Knowledge graph extraction completed: {} sections processed", len(results))
    return results

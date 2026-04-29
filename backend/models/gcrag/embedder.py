import os
os.environ["HF_HOME"] = "D:/hf_cache/hub"
os.environ["TRANSFORMERS_CACHE"] = "D:/hf_cache/hub"

from typing import Dict, List
from sentence_transformers import SentenceTransformer
from loguru import logger
import httpx
import asyncio


# Lazy-loaded model
_model: SentenceTransformer = None


def load_model() -> SentenceTransformer:
    """
    Lazy load BAAI/bge-m3 model on first call.
    
    Returns:
        SentenceTransformer: The loaded model
    """
    global _model
    if _model is None:
        logger.info("Loading BAAI/bge-m3 model from cache: {}", os.environ.get("HF_HOME", "D:/hf_cache/hub"))
        cache_folder = os.environ.get("HF_HOME", "D:/hf_cache/hub")
        _model = SentenceTransformer(
            "BAAI/bge-m3",
            cache_folder=cache_folder,
            trust_remote_code=True
        )
        embedding_dim = _model.get_sentence_embedding_dimension()
        logger.info("Model loaded successfully, embedding dimension: {}", embedding_dim)
    return _model


# def generate_section_description(section: Dict) -> str:
#     """
#     Generate a natural language description of a section's graph.
    
#     Args:
#         section: Dict with keys {section_id, entities, relations, raw_text}
        
#     Returns:
#         str: Natural language description, always non-empty
#     """
#     entities = section.get("entities", [])
#     relations = section.get("relations", [])
#     raw_text = section.get("raw_text", "")
    
#     # If no entities or relations, use raw_text
#     if not entities or not relations:
#         if raw_text:
#             section_id = section.get("section_id", "unknown")
#             description = f"Document section {section_id}: {raw_text[:300]}"
#             logger.debug("Generated section description from raw_text (first 200 chars)")
#             return description
#         elif entities:
#             # Fallback: list entity names
#             entity_names = [e.get("name", "") for e in entities]
#             entity_names = [n for n in entity_names if n]
#             if entity_names:
#                 description = f"This section describes the following concepts: {', '.join(entity_names)}"
#                 logger.debug("Generated section description from entity names")
#                 return description
        
#         # Last resort
#         return "This section has no detailed description available."
    
#     # Find main entity (most connected)
#     connection_count = {}
#     for rel in relations:
#         from_name = rel.get("from", "")
#         to_name = rel.get("to", "")
#         connection_count[from_name] = connection_count.get(from_name, 0) + 1
#         connection_count[to_name] = connection_count.get(to_name, 0) + 1
    
#     main_entity = max(connection_count, key=connection_count.get) if connection_count else "unknown"
    
#     # Build relation descriptions
#     relation_descriptions = []
#     for rel in relations:
#         from_name = rel.get("from", "")
#         rel_type = rel.get("type", "relates to")
#         to_name = rel.get("to", "")
#         relation_descriptions.append(f"{from_name} {rel_type} {to_name}")
    
#     # Generate description
#     if relation_descriptions:
#         desc = f"This section describes {main_entity} including " + ", ".join(relation_descriptions[:5])
#         if len(relation_descriptions) > 5:
#             desc += f", and {len(relation_descriptions) - 5} more relations."
#     else:
#         desc = f"This section describes {main_entity}."
    
#     logger.debug("Generated section description: {}...", desc[:80])
#     return desc



async def generate_section_description_groq(section: dict) -> str:
    raw_text = section.get("raw_text", "")
    entities = section.get("entities", [])
    relations = section.get("relations", [])
    
    entity_names = [e.get("name", "") for e in entities]
    relation_strs = [f"{r.get('from')} {r.get('type')} {r.get('to')}" for r in relations]
    
    prompt = f"""Write a concise 2-3 sentence description of this document section that captures its key topic, specific details, and any important values like fees, deadlines, or eligibility. Make sure the description is specific and distinguishable from other similar sections.

Raw text: {raw_text[:500]}
Key entities: {', '.join(entity_names[:10])}
Key relations: {', '.join(relation_strs[:5])}

Description:"""

    headers = {
        "Authorization": f"Bearer {os.getenv('LLM_API_KEY')}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You write precise, specific document section descriptions."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 150
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload, headers=headers
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning("Groq description failed, using fallback: {}", e)
            return f"Section about: {raw_text[:300]}"


# def embed_section(section: Dict, section_graph_id: str) -> Dict:
#     """
#     Generate embedding for a section's graph.
    
#     Args:
#         section: Dict with keys {section_id, entities, relations, raw_text}
#         section_graph_id: The unique ID for this section graph
        
#     Returns:
#         Dict: {section_graph_id, description, embedding: list[float]}
#     """
#     description = generate_section_description(section)
#     model = load_model()
#     embedding = model.encode(description).tolist()
    
#     logger.info(
#         "Embedded section {} with embedding dimension {}",
#         section_graph_id,
#         len(embedding)
#     )
    
#     return {
#         "section_graph_id": section_graph_id,
#         "description": description,
#         "embedding": embedding
#     }

def embed_section(section: dict, section_graph_id: str) -> dict:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(lambda: asyncio.run(generate_section_description_groq(section)))
            description = future.result(timeout=30)
    else:
        description = asyncio.run(generate_section_description_groq(section))

    model = load_model()
    embedding = model.encode(description).tolist()
    logger.info("Embedded section {} with embedding dimension {}", section_graph_id, len(embedding))
    return {
        "section_graph_id": section_graph_id,
        "description": description,
        "embedding": embedding
    }


def embed_query(query: str) -> List[float]:
    """
    Embed a query string.
    
    Args:
        query: The query string to embed
        
    Returns:
        list[float]: Query embedding
    """
    model = load_model()
    embedding = model.encode(query).tolist()
    
    logger.debug("Embedded query with embedding dimension {}", len(embedding))
    return embedding


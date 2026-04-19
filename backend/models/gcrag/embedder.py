import os
os.environ["HF_HOME"] = os.getenv("HF_HOME", "D:/hf_cache")
import uuid
from typing import Dict, List
from sentence_transformers import SentenceTransformer
from loguru import logger


# Load the model once
_model = None

def load_model():
    global _model
    if _model is None:
        logger.info("Loading BAAI/bge-m3 model...")
        _model = SentenceTransformer('BAAI/bge-m3')
        logger.info("Model loaded, embedding dim: {}", _model.get_sentence_embedding_dimension())
    return _model


def generate_graph_description(graph: Dict) -> str:
    """
    Generate a natural language description of the graph.
    """
    sections = graph.get("sections", [])
    if not sections:
        return "This graph is empty."

    # Collect all entities and relations
    all_entities = {}
    all_relations = []
    for section in sections:
        for entity in section.get("entities", []):
            eid = entity["id"]
            all_entities[eid] = entity
        for rel in section.get("relations", []):
            all_relations.append(rel)

    # Find main entity: the one with most connections
    connection_count = {}
    for rel in all_relations:
        subj = rel["from"]
        obj = rel["to"]
        connection_count[subj] = connection_count.get(subj, 0) + 1
        connection_count[obj] = connection_count.get(obj, 0) + 1

    if not connection_count:
        main_entity = sections[0]["entities"][0]["name"] if sections[0].get("entities") else "unknown"
    else:
        main_entity_id = max(connection_count, key=connection_count.get)
        main_entity = main_entity_id

    # Generate relation descriptions
    relation_descriptions = []
    for rel in all_relations:
        subj_name = rel["from"]
        rel_type = rel["type"]
        obj_name = rel["to"]
        relation_descriptions.append(f"{subj_name} {rel_type} {obj_name}")

    if relation_descriptions:
        desc = f"This graph describes {main_entity} including " + ", ".join(relation_descriptions[:5])
        if len(relation_descriptions) > 5:
            desc += f", and {len(relation_descriptions) - 5} more relations."
    else:
        desc = f"This graph describes {main_entity}."

    logger.info("Generated description for graph: {}", desc[:100] + "..." if len(desc) > 100 else desc)
    return desc


def embed_graph(graph: Dict) -> Dict:
    """
    Generate embedding for the graph.
    Returns {"graph_id": str, "description": str, "embedding": list[float]}
    """
    graph_id = graph.get("graph_id", str(uuid.uuid4()))
    description = generate_graph_description(graph)
    model = load_model()
    embedding = model.encode(description).tolist()

    logger.info("Embedded graph {} with embedding dimension {}", graph_id, len(embedding))
    return {
        "graph_id": graph_id,
        "description": description,
        "embedding": embedding
    }
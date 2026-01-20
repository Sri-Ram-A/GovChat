import json
import faiss
import numpy as np
import re
from loguru import logger

# -------- CONFIG --------
EMBEDDINGS_FILE = "processed_data/embeddings.npy"
SERVICES_FILE = "processed_data/services.json"
TOP_K = 1   # best service only

logger.info(f"[INIT] EMBEDDINGS_FILE={EMBEDDINGS_FILE}")
logger.info(f"[INIT] SERVICES_FILE={SERVICES_FILE}")
logger.info(f"[INIT] TOP_K={TOP_K}")

# -------- LOAD DATA --------
embeddings = np.load(EMBEDDINGS_FILE)
logger.info(f"[LOAD] Embeddings loaded with shape={embeddings.shape}, dtype={embeddings.dtype}")

with open(SERVICES_FILE, "r", encoding="utf-8") as f:
    services = json.load(f)

logger.info(f"[LOAD] Services loaded, count={len(services)}")

# -------- BUILD FAISS INDEX --------
dim = embeddings.shape[1]
logger.info(f"[FAISS] Creating IndexFlatL2 with dim={dim}")

index = faiss.IndexFlatL2(dim)
index.add(embeddings)

logger.success(f"[FAISS] Index built successfully, total_vectors={index.ntotal}")

# -------- DOMAIN SYNONYMS --------
SYNONYMS = {
    "vidhava": "widow",
    "vethana": "pension",
    "vetana": "pension",
    "pension": "pension",
    "widow": "widow",
    "freedom": "freedom",
    "fighter": "fighter",
    "blind": "blind",
    "kurudu": "blind",
    "pass": "pass",
    "bus": "bus",
    "license": "license",
    "licence": "license",
    "renew": "renew",
    "madabeku": "renew",
    "beku": "required",
    "certificate": "certificate",
    "marks": "marks",
    "migration": "migration",
    "duplicate": "duplicate"
}

logger.info(f"[INIT] Synonyms loaded, count={len(SYNONYMS)}")

# -------- TEXT CLEANING --------
def clean_words(text: str):
    logger.debug(f"[CLEAN] Raw input text='{text}'")

    words = re.findall(r"[a-zA-Z]+", text.lower())
    logger.debug(f"[CLEAN] Tokenized words={words}")

    normalized = []
    for w in words:
        mapped = SYNONYMS.get(w, w)
        normalized.append(mapped)
        if mapped != w:
            logger.debug(f"[CLEAN] Synonym mapped '{w}' -> '{mapped}'")

    filtered = [w for w in normalized if len(w) > 2]
    logger.debug(f"[CLEAN] Final normalized words={filtered}")

    return filtered

# -------- RETRIEVAL LOGIC --------
def retrieve_service(question: str):
    logger.info(f"[RETRIEVE] New query received='{question}'")

    words = clean_words(question)
    logger.info(f"[RETRIEVE] Normalized keywords={words}")

    best_score = 0
    best_service = None

    # 1️⃣ Keyword scoring
    for idx, service in enumerate(services):
        text = service["text"].lower()
        score = sum(1 for w in words if w in text)

        if score > 0:
            logger.debug(f"[KEYWORD] Service[{idx}] matched score={score}")

        if score > best_score:
            best_score = score
            best_service = service
            logger.debug(f"[KEYWORD] New best service idx={idx}, score={score}")

    # 2️⃣ Keyword match success
    if best_service and best_score > 0:
        logger.success(f"[RETRIEVE] Keyword match found with score={best_score}")
        return best_service["text"]

    # 3️⃣ FAISS fallback
    logger.warning("[RETRIEVE] No keyword match found, falling back to FAISS")

    logger.debug(f"[FAISS] Attempting to encode query='{question}'")
    logger.debug(f"[FAISS] embeddings object type={type(embeddings)}")

    # ⚠️ This is intentionally logged because this is where it breaks
    query_embedding = embeddings.encode(question).reshape(1, -1)

    logger.debug(f"[FAISS] Query embedding shape={query_embedding.shape}")

    distances, indices = index.search(query_embedding, TOP_K)

    logger.info(f"[FAISS] Search completed indices={indices.tolist()}, distances={distances.tolist()}")

    selected = services[indices[0][0]]
    logger.success(f"[RETRIEVE] FAISS selected service")

    return selected["text"]

import os
os.environ["HF_HOME"] = "D:/hf_cache"

import re
from typing import List, Dict, Tuple

import spacy
import torch
from loguru import logger
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


ENTITY_LABELS = {
    "ORG",
    "PERSON",
    "GPE",
    "DATE",
    "MONEY",
    "PERCENT",
    "LAW",
    "PRODUCT",
}
REBEL_MODEL_NAME = "Babelscape/rebel-large"
REBEL_CONFIDENCE_THRESHOLD = 0.30

_nlp = None
_rebel_tokenizer = None
_rebel_model = None


def load_spacy_model():
    global _nlp
    if _nlp is None:
        logger.info("Loading spaCy model: en_core_web_lg")
        try:
            _nlp = spacy.load("en_core_web_lg")
        except OSError as exc:
            logger.error("spaCy model en_core_web_lg not found: {}", exc)
            raise
    return _nlp


def load_rebel_model():
    global _rebel_tokenizer, _rebel_model
    if _rebel_model is None or _rebel_tokenizer is None:
        logger.info("Loading REBEL model: {}", REBEL_MODEL_NAME)
        _rebel_tokenizer = AutoTokenizer.from_pretrained(REBEL_MODEL_NAME, use_fast=True)
        _rebel_model = AutoModelForSeq2SeqLM.from_pretrained(REBEL_MODEL_NAME)
    return _rebel_tokenizer, _rebel_model


def normalize_section_id(element: dict, idx: int) -> str:
    page = element.get("page_number", 0)
    etype = element.get("element_type", "section")
    return f"section-{idx + 1}-p{page}-{etype.lower()}"


def extract_entities(raw_text: str, section_id: str) -> List[Dict[str, str]]:
    nlp = load_spacy_model()
    doc = nlp(raw_text)
    entities: List[Dict[str, str]] = []
    seen = set()

    NOISE_PHRASES = {
    "a crucial component", "a vital role", "their ability",
    "this paper", "a systematic review", "the reviewed studies",
    "recent advancements", "many existing", "large-scale",
    "online platforms", "public issues"
    }

    # spaCy named entities
    for ent in doc.ents:
        if ent.label_ not in ENTITY_LABELS:
            continue
        name = ent.text.strip()
        if len(name) < 3:
            continue
        key = (ent.label_, name.lower())
        if key in seen:
            continue
        seen.add(key)
        entities.append({
            "id": f"{section_id}_{ent.label_}_{len(entities) + 1}",
            "label": ent.label_,
            "name": name,
        })

    # noun chunk extraction for technical terms spaCy misses
    for chunk in doc.noun_chunks:
        name = chunk.text.strip()
        if len(name) < 4 or len(name.split()) < 2:
            continue
        key = ("CONCEPT", name.lower())
        if name.lower() in NOISE_PHRASES:
           continue
        if name.lower().startswith(("a ", "an ", "the ", "their ", "this ", "these ")):
           continue
        if key in seen:
            continue
        seen.add(key)
        entities.append({
            "id": f"{section_id}_CONCEPT_{len(entities) + 1}",
            "label": "CONCEPT",
            "name": name,
        })

    logger.debug("Extracted {} entities", len(entities))
    return entities


def parse_rebel_output(output_text: str) -> List[Dict[str, str]]:
    """
    REBEL uses special tokens: <triplet> <subj> <obj>
    Format: <triplet> subject <subj> object <obj> relation
    """
    triples = []
    current_subj = None
    current_obj = None

    tokens = output_text.split("<")
    for token in tokens:
        token = token.strip()
        if token.startswith("triplet>"):
            current_subj = token.replace("triplet>", "").strip()
            current_obj = None
        elif token.startswith("subj>"):
            current_obj = token.replace("subj>", "").strip()
        elif token.startswith("obj>") and current_subj and current_obj:
            relation = token.replace("obj>", "").strip()
            if current_subj and current_obj and relation:
                triples.append({
                    "from": current_subj,
                    "type": relation,
                    "to": current_obj
                })

    logger.debug("Parsed {} triples from REBEL output", len(triples))
    return triples


def evaluate_generation_confidence(outputs) -> float:
    if not hasattr(outputs, "scores") or outputs.scores is None:
        return 0.0

    score_values: List[float] = []
    for score in outputs.scores:
        probs = torch.softmax(score, dim=-1)
        top_prob, _ = probs.max(dim=-1)
        score_values.append(top_prob.mean().item())

    if not score_values:
        return 0.0
    return float(sum(score_values) / len(score_values))


def extract_relations_rebel(raw_text: str) -> Tuple[List[Dict[str, str]], float]:
    tokenizer, model = load_rebel_model()
    logger.info("Running REBEL relation extraction")

    inputs = tokenizer(
        raw_text,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    )

    outputs = model.generate(
    **inputs,
    max_length=512,        # increased from 256
    num_beams=4,
    num_return_sequences=3,  # get 3 candidate outputs
    early_stopping=True,
    output_scores=True,
    return_dict_in_generate=True,
    )
    # parse all sequences, not just first
    all_relations = []
    for seq in outputs.sequences:
        generated_text = tokenizer.decode(seq, skip_special_tokens=False)
        relations = parse_rebel_output(generated_text)
        all_relations.extend(relations)

    # deduplicate
    seen = set()
    unique_relations = []
    for r in all_relations:
       key = (r["from"].lower().strip(), r["type"].lower().strip(), r["to"].lower().strip())
       if key not in seen:
          seen.add(key)
          unique_relations.append(r)

    confidence = evaluate_generation_confidence(outputs)
    logger.debug("REBEL generated {} unique relations with confidence {:.3f}", 
             len(unique_relations), confidence)
    return unique_relations, confidence




def regex_extract_relations(raw_text: str) -> List[Dict[str, str]]:
    logger.info("Applying rule-based relation extraction fallback")
    patterns = [
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+eligible for\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "eligible_for"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+requires\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "requires"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+provides\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "provides"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+managed by\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "managed_by"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+is used (?:for|in)\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "used_in"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+is a component of\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "component_of"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+based on\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "based_on"),
    (r"(?P<subj>[A-Z][\w\s]{1,60}?)\s+proposed by\s+(?P<obj>[A-Z][\w\s]{1,60}?)[,.]", "proposed_by"),
]

    relations: List[Dict[str, str]] = []
    for pattern, relation_type in patterns:
        for match in re.finditer(pattern, raw_text, flags=re.IGNORECASE):
            subj = match.group("subj").strip()
            obj = match.group("obj").strip()
            if subj and obj:
                relations.append({"from": subj, "type": relation_type, "to": obj})

    logger.debug("Rule-based extractor found {} relations", len(relations))
    return relations


def extract_graph(elements: List[Dict[str, str]]) -> List[Dict[str, object]]:
    logger.info("Starting graph extraction for {} document sections", len(elements))
    sections: List[Dict[str, object]] = []

    for idx, element in enumerate(elements):
        section_id = element.get("section_id") or normalize_section_id(element, idx)
        raw_text = element.get("text", "").strip()

        if not raw_text:
            logger.warning("Skipping empty section: {}", section_id)
            continue

        logger.info("Extracting section {}", section_id)
        entities = extract_entities(raw_text, section_id)

        relations, confidence = [], 0.0
        try:
            relations, confidence = extract_relations_rebel(raw_text)
        except Exception as exc:
            logger.warning("REBEL relation extraction failed for {}: {}", section_id, exc)

        if not relations or confidence < REBEL_CONFIDENCE_THRESHOLD:
            relations = regex_extract_relations(raw_text)
            if not relations:
                logger.debug("No relations found for section {}", section_id)

        sections.append(
            {
                "section_id": section_id,
                "entities": entities,
                "relations": relations,
                "raw_text": raw_text,
            }
        )

    logger.info("Completed graph extraction for {} sections", len(sections))
    return sections

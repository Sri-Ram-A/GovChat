import os
os.environ["HF_HOME"] = os.getenv("HF_HOME", "D:/hf_cache")

from dotenv import load_dotenv
load_dotenv()

import os
import uuid
from typing import Dict, List, Optional
from neo4j import AsyncGraphDatabase
from loguru import logger


class GraphStore:
    """Per-section Graph-RAG store using Neo4j AsyncGraphDatabase."""

    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.database = os.getenv("NEO4J_DATABASE", "neo4j")
        self.driver = None
        logger.info("GraphStore initialized with URI: {}", self.uri)

    async def _get_driver(self):
        """Get or create Neo4j AsyncGraphDatabase driver."""
        if self.driver is None:
            try:
                self.driver = AsyncGraphDatabase.driver(
                    self.uri,
                    auth=(self.user, self.password)
                )
                logger.info("Connected to Neo4j at {}", self.uri)
            except Exception as e:
                logger.error("Failed to connect to Neo4j: {}", e)
                raise
        return self.driver

    async def close(self):
        """Close Neo4j connection."""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j connection closed")

    async def _ensure_constraints(self, session):
        """Ensure Neo4j constraints are created."""
        try:
            await session.run(
                "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Section) REQUIRE s.id IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE"
            )
            logger.debug("Constraints ensured")
        except Exception as e:
            logger.warning("Could not ensure constraints: {}", e)

    async def store_section_graph(
        self, section: Dict, document_id: str
    ) -> str:
        """
        Store a single section's graph in Neo4j.
        
        Args:
            section: Dict with keys {section_id, entities, relations, raw_text}
            document_id: The parent document ID
            
        Returns:
            section_graph_id (UUID)
        """
        section_graph_id = str(uuid.uuid4())
        logger.info(
            "Storing section graph {} for document {}",
            section_graph_id,
            document_id
        )

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                await self._ensure_constraints(session)

                section_id = section.get("section_id", "")
                raw_text = section.get("raw_text", "")
                entities = section.get("entities", [])
                relations = section.get("relations", [])

                # Create Section node
                await session.run(
                    """
                    CREATE (s:Section {
                        id: $section_graph_id,
                        document_id: $document_id,
                        section_id: $section_id,
                        raw_text: $raw_text
                    })
                    """,
                    section_graph_id=section_graph_id,
                    document_id=document_id,
                    section_id=section_id,
                    raw_text=raw_text
                )
                logger.debug("Created Section node {}", section_graph_id)

                # Create Entity nodes and link to Section via HAS_ENTITY
                for entity in entities:
                    entity_id = entity.get("id", str(uuid.uuid4()))
                    entity_name = entity.get("name", "")
                    entity_label = entity.get("label", "")

                    await session.run(
                        """
                        MERGE (e:Entity {id: $entity_id})
                        SET e.name = $entity_name, e.label = $entity_label
                        WITH e
                        MATCH (s:Section {id: $section_graph_id})
                        MERGE (s)-[:HAS_ENTITY]->(e)
                        """,
                        entity_id=entity_id,
                        entity_name=entity_name,
                        entity_label=entity_label,
                        section_graph_id=section_graph_id
                    )
                logger.debug("Created {} entities for section {}", len(entities), section_graph_id)

                # Create relations between entities
                for relation in relations:
                    from_name = relation.get("from", "")
                    to_name = relation.get("to", "")
                    rel_type = relation.get("type", "RELATED").upper().replace(" ", "_").replace("-", "_")

                    await session.run(
                        f"""
                        MATCH (s:Section {{id: $section_graph_id}})
                        MATCH (s)-[:HAS_ENTITY]->(a:Entity {{name: $from_name}})
                        MATCH (s)-[:HAS_ENTITY]->(b:Entity {{name: $to_name}})
                        MERGE (a)-[:{rel_type}]->(b)
                        """,
                        section_graph_id=section_graph_id,
                        from_name=from_name,
                        to_name=to_name
                    )
                logger.debug("Created {} relations for section {}", len(relations), section_graph_id)

                logger.info(
                    "Successfully stored section graph {} with {} entities and {} relations",
                    section_graph_id,
                    len(entities),
                    len(relations)
                )
                return section_graph_id

            except Exception as e:
                logger.error("Failed to store section graph: {}", e)
                raise

    async def get_section_graph(self, section_graph_id: str) -> Dict:
        """
        Retrieve a section graph from Neo4j.
        
        Args:
            section_graph_id: The section graph ID to retrieve
            
        Returns:
            Dict with keys {section_graph_id, section_id, raw_text, entities, relations}
        """
        logger.info("Retrieving section graph: {}", section_graph_id)

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                # Get Section metadata
                section_result = await session.run(
                    """
                    MATCH (s:Section {id: $section_graph_id})
                    RETURN s.section_id as section_id, s.raw_text as raw_text
                    """,
                    section_graph_id=section_graph_id
                )
                section_record = await section_result.single()
                if not section_record:
                    logger.warning("Section graph not found: {}", section_graph_id)
                    return None

                section_id = section_record["section_id"]
                raw_text = section_record["raw_text"]

                # Get entities
                entities_result = await session.run(
                    """
                    MATCH (s:Section {id: $section_graph_id})-[:HAS_ENTITY]->(e:Entity)
                    RETURN e.id as id, e.name as name, e.label as label
                    """,
                    section_graph_id=section_graph_id
                )
                entities = []
                async for record in entities_result:
                    entities.append({
                        "id": record["id"],
                        "name": record["name"],
                        "label": record["label"]
                    })

                # Get relations
                relations_result = await session.run(
                    """
                    MATCH (s:Section {id: $section_graph_id})-[:HAS_ENTITY]->(a:Entity)-[r]->(b:Entity)
                    WHERE (s)-[:HAS_ENTITY]->(b)
                    RETURN a.name as from, b.name as to, type(r) as type
                    """,
                    section_graph_id=section_graph_id
                )
                relations = []
                async for record in relations_result:
                    relations.append({
                        "from": record["from"],
                        "to": record["to"],
                        "type": record["type"].lower().replace("_", " ")
                    })

                result = {
                    "section_graph_id": section_graph_id,
                    "section_id": section_id,
                    "raw_text": raw_text,
                    "entities": entities,
                    "relations": relations
                }

                logger.info(
                    "Retrieved section graph with {} entities and {} relations",
                    len(entities),
                    len(relations)
                )
                return result

            except Exception as e:
                logger.error("Failed to retrieve section graph {}: {}", section_graph_id, e)
                raise

    async def traverse_section_graph(
        self, section_graph_id: str, query_keywords: List[str]
    ) -> str:
        """
        Traverse section graph and return relevant context as text.
        
        Args:
            section_graph_id: The section graph ID
            query_keywords: List of keywords to search for
            
        Returns:
            Text context of matching entities and their relations
        """
        logger.info("Traversing section graph {} for keywords: {}", section_graph_id, query_keywords)

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                # Find entities matching keywords (case-insensitive)
                keyword_filters = " OR ".join(
                    [f"toLower(e.name) CONTAINS toLower($kw{i})" for i in range(len(query_keywords))]
                )
                params = {
                    "section_graph_id": section_graph_id,
                    **{f"kw{i}": kw for i, kw in enumerate(query_keywords)}
                }

                matching_result = await session.run(
                    f"""
                    MATCH (s:Section {{id: $section_graph_id}})-[:HAS_ENTITY]->(e:Entity)
                    WHERE {keyword_filters}
                    RETURN e.id as id, e.name as name, e.label as label
                    """,
                    params
                )

                matched_entities = []
                async for record in matching_result:
                    matched_entities.append({
                        "id": record["id"],
                        "name": record["name"],
                        "label": record["label"]
                    })

                # If no entities match, fall back to raw_text
                if not matched_entities:
                    logger.debug("No matching entities for keywords, falling back to raw_text")
                    section_result = await session.run(
                        """
                        MATCH (s:Section {id: $section_graph_id})
                        RETURN s.raw_text as raw_text
                        """,
                        section_graph_id=section_graph_id
                    )
                    section_record = await section_result.single()
                    if section_record and section_record["raw_text"]:
                        return section_record["raw_text"]
                    return "No relevant information found in this section."

                # Build context from matched entities and their relations
                context_parts = []
                for entity in matched_entities:
                    entity_id = entity["id"]
                    entity_name = entity["name"]
                    entity_label = entity["label"]

                    context_parts.append(f"Entity: {entity_name} (Type: {entity_label})")

                    # Get outgoing relations
                    out_result = await session.run(
                        """
                        MATCH (e:Entity {id: $entity_id})-[r]->(b:Entity)
                        RETURN b.name as to_name, type(r) as rel_type
                        """,
                        entity_id=entity_id
                    )
                    async for record in out_result:
                        rel_text = f"  → {record['rel_type'].lower().replace('_', ' ')} → {record['to_name']}"
                        context_parts.append(rel_text)

                    # Get incoming relations
                    in_result = await session.run(
                        """
                        MATCH (a:Entity)-[r]->(e:Entity {id: $entity_id})
                        RETURN a.name as from_name, type(r) as rel_type
                        """,
                        entity_id=entity_id
                    )
                    async for record in in_result:
                        rel_text = f"  ← {record['rel_type'].lower().replace('_', ' ')} ← {record['from_name']}"
                        context_parts.append(rel_text)

                logger.info("Generated context with {} matched entities", len(context_parts))
                raw_text_result = await session.run(
    "MATCH (s:Section {id: $sgid}) RETURN s.raw_text as raw_text",
    sgid=section_graph_id
)
                raw_record = await raw_text_result.single()
                if raw_record and raw_record["raw_text"]:
                    context_parts.append(f"Raw text: {raw_record['raw_text']}")
                return "\n".join(context_parts)

            except Exception as e:
                logger.error("Failed to traverse section graph {}: {}", section_graph_id, e)
                raise

    async def list_all_section_graphs(self, document_id: Optional[str] = None) -> List[Dict]:
        """
        List all section graphs, optionally filtered by document_id.
        
        Args:
            document_id: Optional document ID to filter by
            
        Returns:
            List of dicts with {section_graph_id, document_id, section_id, entity_count}
        """
        logger.info("Listing section graphs for document_id: {}", document_id)

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                if document_id:
                    result = await session.run(
                        """
                        MATCH (s:Section {document_id: $document_id})
                        RETURN s.id as section_graph_id, s.document_id as document_id,
                               s.section_id as section_id,
                               COUNT { (s)-[:HAS_ENTITY]->() } as entity_count
                        """,
                        document_id=document_id
                    )
                else:
                    result = await session.run(
                        """
                        MATCH (s:Section)
                        RETURN s.id as section_graph_id, s.document_id as document_id,
                               s.section_id as section_id,
                               COUNT { (s)-[:HAS_ENTITY]->() } as entity_count
                        """
                    )

                section_graphs = []
                async for record in result:
                    section_graphs.append({
                        "section_graph_id": record["section_graph_id"],
                        "document_id": record["document_id"],
                        "section_id": record["section_id"],
                        "entity_count": record["entity_count"]
                    })

                logger.info("Found {} section graphs", len(section_graphs))
                return section_graphs

            except Exception as e:
                logger.error("Failed to list section graphs: {}", e)
                raise

    async def delete_document_graphs(self, document_id: str) -> int:
        """
        Delete all section graphs belonging to a document_id.
        
        Args:
            document_id: The document ID
            
        Returns:
            Count of sections deleted
        """
        logger.info("Deleting all section graphs for document: {}", document_id)

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                result = await session.run(
                    """
                    MATCH (s:Section {document_id: $document_id})
                    DETACH DELETE s
                    RETURN count(s) as deleted_count
                    """,
                    document_id=document_id
                )
                record = await result.single()
                deleted_count = record["deleted_count"] if record else 0

                logger.info("Deleted {} section graphs for document {}", deleted_count, document_id)
                return deleted_count

            except Exception as e:
                logger.error("Failed to delete document graphs {}: {}", document_id, e)
                raise

    async def delete_section_graph(self, section_graph_id: str) -> bool:
        """
        Delete one specific section graph.
        
        Args:
            section_graph_id: The section graph ID
            
        Returns:
            True if deleted, False if not found
        """
        logger.info("Deleting section graph: {}", section_graph_id)

        driver = await self._get_driver()
        async with driver.session(database=self.database) as session:
            try:
                result = await session.run(
                    """
                    MATCH (s:Section {id: $section_graph_id})
                    DETACH DELETE s
                    RETURN count(s) as deleted_count
                    """,
                    section_graph_id=section_graph_id
                )
                record = await result.single()
                deleted_count = record["deleted_count"] if record else 0

                logger.info("Deleted section graph {}: {}", section_graph_id, deleted_count > 0)
                return deleted_count > 0

            except Exception as e:
                logger.error("Failed to delete section graph {}: {}", section_graph_id, e)
                raise


# Global GraphStore instance
_graph_store: Optional[GraphStore] = None


async def _get_graph_store() -> GraphStore:
    """Get or create global GraphStore instance."""
    global _graph_store
    if _graph_store is None:
        _graph_store = GraphStore()
    return _graph_store


# Module-level convenience functions
async def store_section_graph(section: Dict, document_id: str) -> str:
    """Store a section graph."""
    store = await _get_graph_store()
    return await store.store_section_graph(section, document_id)


async def get_section_graph(section_graph_id: str) -> Dict:
    """Get a section graph."""
    store = await _get_graph_store()
    return await store.get_section_graph(section_graph_id)


async def traverse_section_graph(
    section_graph_id: str, query_keywords: List[str]
) -> str:
    """Traverse a section graph."""
    store = await _get_graph_store()
    return await store.traverse_section_graph(section_graph_id, query_keywords)


async def list_all_section_graphs(document_id: Optional[str] = None) -> List[Dict]:
    """List all section graphs."""
    store = await _get_graph_store()
    return await store.list_all_section_graphs(document_id)


async def delete_document_graphs(document_id: str) -> int:
    """Delete all graphs for a document."""
    store = await _get_graph_store()
    return await store.delete_document_graphs(document_id)


async def delete_section_graph(section_graph_id: str) -> bool:
    """Delete a section graph."""
    store = await _get_graph_store()
    return await store.delete_section_graph(section_graph_id)


async def close_graph_store():
    """Close the global GraphStore instance."""
    global _graph_store
    if _graph_store:
        await _graph_store.close()
        _graph_store = None


# Global instance
graph_store = GraphStore()


# Convenience functions (async)
async def store_graph(graph: Dict) -> str:
    return await graph_store.store_graph(graph)

async def get_graph(graph_id: str) -> Dict:
    return await graph_store.get_graph(graph_id)

async def traverse_graph(graph_id: str, query_keywords: List[str]) -> str:
    return await graph_store.traverse_graph(graph_id, query_keywords)

async def list_graphs() -> List[Dict]:
    return await graph_store.list_graphs()

async def delete_graph(graph_id: str) -> bool:
    return await graph_store.delete_graph(graph_id)
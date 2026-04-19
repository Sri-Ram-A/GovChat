import os
import uuid
import asyncio
from typing import Dict, List, Optional
from neo4j import AsyncGraphDatabase
from loguru import logger
from dotenv import load_dotenv
load_dotenv()


class GraphStore:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None

    async def _get_driver(self):
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
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j connection closed")

    async def store_graph(self, graph: Dict) -> str:
        """
        Store a graph in Neo4j.
        graph: {"sections": list of section dicts}
        Returns graph_id
        """
        graph_id = str(uuid.uuid4())
        logger.info("Storing graph with ID: {}", graph_id)

        driver = await self._get_driver()
        async with driver.session(database=os.getenv("NEO4J_DATABASE", "gcragdb")) as session:
            try:
                # Create constraint if not exists
                await session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE")

                sections = graph.get("sections", [])
                for section in sections:
                    section_id = section.get("section_id", "")
                    entities = section.get("entities", [])
                    relations = section.get("relations", [])

                    # Store entities
                    for entity in entities:
                        await session.run(
                            """
                            MERGE (n:Entity {id: $id})
                            SET n.label = $label, n.name = $name, n.document_id = $document_id, n.section_id = $section_id
                            """,
                            id=entity["id"],
                            label=entity["label"],
                            name=entity["name"],
                            document_id=graph_id,
                            section_id=section_id
                        )

                    # Store relations
                    for relation in relations:
                        from_name = relation["from"]
                        to_name = relation["to"]
                        rel_type = relation["type"].upper().replace(" ", "_").replace("-", "_")

                        await session.run(
                            f"""
                            MERGE (a:Entity {{name: $from_name, document_id: $document_id}})
                            MERGE (b:Entity {{name: $to_name, document_id: $document_id}})
                            MERGE (a)-[:{rel_type}]->(b)
                            """,
                            from_name=from_name,
                            to_name=to_name,
                            document_id=graph_id
                            )

                logger.info("Successfully stored graph with {} sections", len(sections))
                return graph_id

            except Exception as e:
                logger.error("Failed to store graph: {}", e)
                raise

    async def get_graph(self, graph_id: str) -> Dict:
        """
        Retrieve a graph from Neo4j.
        Returns {"sections": [...]}
        """
        logger.info("Retrieving graph: {}", graph_id)

        driver = await self._get_driver()
        async with driver.session(database=os.getenv("NEO4J_DATABASE", "gcragdb")) as session:
            try:
                # Get entities grouped by section
                result = await session.run(
                    """
                    MATCH (n:Entity {document_id: $graph_id})
                    RETURN coalesce(n.section_id, 'default') as section_id, collect(n) as entities
                    """,
                    graph_id=graph_id
                )
                sections = []
                async for record in result:
                    section_id = record["section_id"]
                    entities = [
                        {
                            "id": node["id"],
                            "label": node["label"],
                            "name": node["name"]
                        }
                        for node in record["entities"]
                    ]

                    # Get relations for this section
                    rel_result = await session.run(
                        """
                        MATCH (a:Entity {document_id: $graph_id, section_id: $section_id})-[r]->(b:Entity {document_id: $graph_id})
                        RETURN type(r) as rel_type, a.name as from_name, b.name as to_name
                        """,
                        graph_id=graph_id,
                        section_id=section_id
                    )
                    relations = []
                    async for rel_record in rel_result:
                        relations.append({
                            "from": rel_record["from_name"],
                            "type": rel_record["rel_type"].lower().replace("_", " "),
                            "to": rel_record["to_name"]
                        })

                    sections.append({
                        "section_id": section_id,
                        "entities": entities,
                        "relations": relations,
                        "raw_text": ""  # Not stored, so empty
                    })

                logger.info("Retrieved graph with {} sections", len(sections))
                return {"sections": sections}

            except Exception as e:
                logger.error("Failed to retrieve graph {}: {}", graph_id, e)
                raise

    async def traverse_graph(self, graph_id: str, query_keywords: List[str]) -> str:
        """
        Traverse graph and return relevant context as text.
        """
        logger.info("Traversing graph {} for keywords: {}", graph_id, query_keywords)

        driver = await self._get_driver()
        async with driver.session(database=os.getenv("NEO4J_DATABASE", "gcragdb")) as session:
            try:
                # Find nodes matching keywords
                keyword_condition = " OR ".join([f"toLower(n.name) CONTAINS toLower('{kw}')" for kw in query_keywords])
                result = await session.run(
                    f"""
                    MATCH (n:Entity {{document_id: $graph_id}})
                    WHERE {keyword_condition}
                    RETURN n
                    """,
                    graph_id=graph_id
                )

                relevant_nodes = []
                async for record in result:
                    relevant_nodes.append(record["n"])

                if not relevant_nodes:
                    logger.debug("No keyword nodes found, trying fallback for graph {}", graph_id)
                    fallback_result = await session.run(
                        """
                        MATCH (n:Entity {document_id: $graph_id})
                        RETURN n.name as name, n.label as label
                        LIMIT 30
                        """,
                        graph_id=graph_id
                    )
                    names = []
                    async for record in fallback_result:
                        names.append(f"{record['label']}: {record['name']}")
                    if names:
                        return "Known entities:\n" + "\n".join(names)
                    return "No relevant information found."

                
                

                # Get connected nodes and relations
                context_parts = []
                for node in relevant_nodes:
                    node_id = node["id"]
                    node_name = node["name"]

                    # Get outgoing relations
                    out_result = await session.run(
                        """
                        MATCH (a:Entity {id: $node_id})-[r]->(b:Entity {document_id: $graph_id})
                        RETURN type(r) as rel_type, b.name as to_name
                        """,
                        node_id=node_id,
                        graph_id=graph_id
                    )

                    relations = []
                    async for rel_record in out_result:
                        relations.append(f"{node_name} {rel_record['rel_type'].lower().replace('_', ' ')} {rel_record['to_name']}")

                    # Get incoming relations
                    in_result = await session.run(
                        """
                        MATCH (a:Entity {document_id: $graph_id})-[r]->(b:Entity {id: $node_id})
                        RETURN type(r) as rel_type, a.name as from_name
                        """,
                        node_id=node_id,
                        graph_id=graph_id
                    )

                    async for rel_record in in_result:
                        relations.append(f"{rel_record['from_name']} {rel_record['rel_type'].lower().replace('_', ' ')} {node_name}")

                    if relations:
                        context_parts.append(f"Entity: {node_name} ({node['label']})\n" + "\n".join(relations))
                    else:
                        context_parts.append(f"Entity: {node_name} ({node['label']})")

                context = "\n\n".join(context_parts)
                logger.info("Generated context with {} characters", len(context))
                return context

            except Exception as e:
                logger.error("Failed to traverse graph {}: {}", graph_id, e)
                raise

    async def list_graphs(self) -> List[Dict]:
        """
        List all graphs with metadata.
        """
        logger.info("Listing all graphs")

        driver = await self._get_driver()
        async with driver.session(database=os.getenv("NEO4J_DATABASE", "gcragdb")) as session:
            try:
                result = await session.run(
                    """
                    MATCH (n:Entity)
                    RETURN DISTINCT n.document_id as graph_id, count(n) as node_count
                    """
                )
                graphs = []
                async for record in result:
                    graphs.append({
                        "graph_id": record["graph_id"],
                        "node_count": record["node_count"]
                    })

                logger.info("Found {} graphs", len(graphs))
                return graphs

            except Exception as e:
                logger.error("Failed to list graphs: {}", e)
                raise

    async def delete_graph(self, graph_id: str) -> bool:
        """
        Delete a graph from Neo4j.
        """
        logger.info("Deleting graph: {}", graph_id)

        driver = await self._get_driver()
        async with driver.session(database=os.getenv("NEO4J_DATABASE", "gcragdb")) as session:
            try:
                result = await session.run(
                    """
                    MATCH (n:Entity {document_id: $graph_id})
                    DETACH DELETE n
                    RETURN count(n) as deleted_count
                    """,
                    graph_id=graph_id
                )
                record = await result.single()
                deleted_count = record["deleted_count"] if record else 0

                logger.info("Deleted {} nodes for graph {}", deleted_count, graph_id)
                return deleted_count > 0

            except Exception as e:
                logger.error("Failed to delete graph {}: {}", graph_id, e)
                raise


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
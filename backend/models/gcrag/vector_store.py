import os
from typing import Dict, List, Optional
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from loguru import logger
import uuid
from qdrant_client.http.models import PointIdsList


class VectorStore:
    COLLECTION_NAME = "gcrag_graphs"
    VECTOR_SIZE = 1024

    def __init__(self):
        self.url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.client: Optional[AsyncQdrantClient] = None
        self._initialized = False

    async def initialize(self) -> None:
        if self._initialized:
            return

        try:
            self.client = AsyncQdrantClient(url=self.url, api_key=self.api_key)
            logger.info("Initialized async Qdrant client at {}", self.url)
            await self._ensure_collection()
            self._initialized = True
        except Exception as e:
            logger.error("Failed to initialize Qdrant client: {}", e)
            raise

    async def _ensure_collection(self) -> None:
        try:
            await self.client.get_collection(collection_name=self.COLLECTION_NAME)
            logger.info("Qdrant collection '{}' already exists", self.COLLECTION_NAME)
        except Exception:
            logger.info("Creating Qdrant collection '{}'", self.COLLECTION_NAME)
            await self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=rest.VectorParams(size=self.VECTOR_SIZE, distance=rest.Distance.COSINE),
            )

    async def upsert_embedding(self, graph_id: str, embedding: List[float], metadata: Dict) -> bool:
        logger.info("Upserting embedding for graph_id={}", graph_id)
        await self.initialize()

        try:
            await self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=[rest.PointStruct(id=str(uuid.UUID(graph_id)), vector=embedding, payload=metadata)],
            )
            logger.info("Upsert successful for graph_id={}", graph_id)
            return True
        except Exception as e:
            logger.error("Failed to upsert embedding for graph_id={}: {}", graph_id, e)
            return False

    async def search(self, query_embedding: List[float], top_k: int = 3) -> List[Dict]:
        logger.info("Searching Qdrant for top_k={} results", top_k)
        await self.initialize()

        try:
            response = await self.client.search(
                collection_name=self.COLLECTION_NAME,
                query_vector=query_embedding,
                limit=top_k,
                with_payload=True,
            )
            results = [
                {
                    "graph_id": str(hit.id),
                    "score": float(hit.score or 0.0),
                    "metadata": hit.payload or {},
                }
                for hit in response
            ]
            logger.info("Search returned {} hits", len(results))
            return results
        except Exception as e:
            logger.error("Qdrant search failed: {}", e)
            return []

    async def delete_embedding(self, graph_id: str) -> bool:
        logger.info("Deleting embedding for graph_id={}", graph_id)
        await self.initialize()

        try:
            await self.client.delete(collection_name=self.COLLECTION_NAME, points_selector=PointIdsList(points=[graph_id]))
            logger.info("Deleted embedding for graph_id={}", graph_id)
            return True
        except Exception as e:
            logger.error("Failed to delete embedding for graph_id={}: {}", graph_id, e)
            return False

    async def list_all(self) -> List[Dict]:
        logger.info("Listing all embeddings in collection '{}'", self.COLLECTION_NAME)
        await self.initialize()

        try:
            points, _ = await self.client.scroll(collection_name=self.COLLECTION_NAME, limit=100)
            items = [
               {
                 "graph_id": str(point.id),
                 "metadata": point.payload or {},
               }
               for point in points
        ]
            logger.info("Listed {} embeddings", len(items))
            return items
        except Exception as e:
            logger.error("Failed to list embeddings: {}", e)
            return []


vector_store = VectorStore()


async def upsert_embedding(graph_id: str, embedding: List[float], metadata: Dict) -> bool:
    return await vector_store.upsert_embedding(graph_id, embedding, metadata)


async def search(query_embedding: List[float], top_k: int = 3) -> List[Dict]:
    return await vector_store.search(query_embedding, top_k)


async def delete_embedding(graph_id: str) -> bool:
    return await vector_store.delete_embedding(graph_id)


async def list_all() -> List[Dict]:
    return await vector_store.list_all()

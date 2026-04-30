import httpx
from loguru import logger
from django.conf import settings

GCRAG_URL = getattr(settings, "GCRAG_URL", "http://localhost:8001")

class GCRAGClient:

    def __init__(self, url: str = GCRAG_URL):
        self.url = url
        self.top_k = 3

    def response(self, query: str) -> str:
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    f"{self.url}/query",
                    json={"question": query, "top_k": self.top_k}
                )
                resp.raise_for_status()
                data = resp.json()
                answer = data.get("answer", "")
                logger.info("[GCRAG] Answer: {}", answer[:100])
                return answer
        except Exception as e:
            logger.error("[GCRAG] Request failed: {}", e)
            return "Sorry, I could not retrieve an answer at this time."

    def close(self):
        pass  # httpx client is context-managed, nothing to close
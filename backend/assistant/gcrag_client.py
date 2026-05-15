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
                formatted_response = self.format_response(answer)
                logger.info("[GCRAG] Answer: {}", formatted_response[:100])
                return formatted_response
        except Exception as e:
            logger.error("[GCRAG] Request failed: {}", e)
            return "Sorry, I could not retrieve an answer at this time."
        
    def format_response(self, text: str) -> str:
        """Format the response text for better readability."""
        lines = text.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                formatted_lines.append('')
                continue
            
            # Handle numbered lists (1., 2., 3.)
            if line[0].isdigit() and '. ' in line[:3]:
                # Add line break and bold for list items
                formatted_lines.append(f'\n• **{line}**')
            # Handle bullet points
            elif line.startswith('- ') or line.startswith('* '):
                formatted_lines.append(f'  {line}')
            # Handle headings (all caps or ends with :)
            elif line.isupper() or line.endswith(':'):
                formatted_lines.append(f'\n**{line}**\n')
            else:
                formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)


    def close(self):
        pass  # httpx client is context-managed, nothing to close
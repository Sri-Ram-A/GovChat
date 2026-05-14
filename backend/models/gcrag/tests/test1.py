# test_qdrant_check.py
import asyncio
from dotenv import load_dotenv
load_dotenv()

from vector_store import list_all

async def main():
    items = await list_all()
    for item in items:
        print(f"\nGraph ID: {item['graph_id']}")
        print(f"Description: {item['metadata'].get('description', 'N/A')}")
        print(f"Filename: {item['metadata'].get('filename', 'N/A')}")

asyncio.run(main())
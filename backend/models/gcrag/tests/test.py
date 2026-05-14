# test_descriptions.py
import asyncio
from dotenv import load_dotenv
load_dotenv()

from vector_store import list_all

async def main():
    items = await list_all()
    print(f"Total: {len(items)}")
    for item in items:
        desc = item['metadata'].get('description', '')
        section_id = item['metadata'].get('section_id', '')
        if 'farmer' in desc.lower() or 'farmer' in section_id.lower() or 'registration' in desc.lower():
            print(f"\nSection: {section_id}")
            print(f"Description: {desc}")

asyncio.run(main())
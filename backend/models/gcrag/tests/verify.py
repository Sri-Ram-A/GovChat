# # test_new_arch.py
# import asyncio
# from dotenv import load_dotenv
# load_dotenv()

# from graph_store import list_all_section_graphs
# from vector_store import list_all

# async def main():
#     # Check Neo4j
#     sections = await list_all_section_graphs()
#     print(f"Neo4j section graphs: {len(sections)}")
#     for s in sections[:3]:
#         print(f"  {s}")

#     # Check Qdrant
#     embeddings = await list_all()
#     print(f"\nQdrant embeddings: {len(embeddings)}")
#     for e in embeddings[:3]:
#         print(f"  {e}")

# asyncio.run(main())

# test_farmer3.py
import asyncio
from dotenv import load_dotenv
load_dotenv()

from vector_store import list_all

async def main():
    items = await list_all()
    for item in items:
        desc = item['metadata'].get('description', '')
        section_id = item['metadata'].get('section_id', '')
        if '2 day' in desc.lower() or 'farmer reg' in desc.lower() or 'registration' in desc.lower():
            print(f"Section: {section_id}")
            print(f"Description: {desc}\n")

asyncio.run(main())
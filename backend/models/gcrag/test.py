# test_neo4j_check.py
import asyncio
from dotenv import load_dotenv
load_dotenv()

from graph_store import get_graph, list_graphs

async def main():
    graphs = await list_graphs()
    print(f"Total graphs: {len(graphs)}")
    
    for g in graphs:
        print(f"\nGraph: {g['graph_id']} | Nodes: {g['node_count']}")
        full = await get_graph(g['graph_id'])
        for section in full['sections'][:3]:
            print(f"\n  Section: {section['section_id']}")
            print(f"  Entities: {[e['name'] for e in section['entities'][:5]]}")
            print(f"  Relations: {section['relations'][:2]}")

asyncio.run(main())
from parser import parse_document
from extractor import extract_graph

elements = parse_document("sample.pdf")

# test on first 3 elements only — REBEL is slow
test_elements = elements[:3]

graphs = extract_graph(test_elements)

for g in graphs:
    print(f"\n--- {g['section_id']} ---")
    print(f"Entities ({len(g['entities'])}):")
    for e in g['entities']:
        print(f"  [{e['label']}] {e['name']}")
    print(f"Relations ({len(g['relations'])}):")
    for r in g['relations']:
        print(f"  {r['from']} --[{r['type']}]--> {r['to']}")
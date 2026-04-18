import sys
print(f"Python: {sys.version}")

errors = []

try:
    import fastapi
    print(f"✅ fastapi: {fastapi.__version__}")
except Exception as e:
    errors.append(f"❌ fastapi: {e}")

try:
    import uvicorn
    print(f"✅ uvicorn: {uvicorn.__version__}")
except Exception as e:
    errors.append(f"❌ uvicorn: {e}")

try:
    import pdfplumber
    print(f"✅ pdfplumber: {pdfplumber.__version__}")
except Exception as e:
    errors.append(f"❌ pdfplumber: {e}")

try:
    import spacy
    nlp = spacy.load("en_core_web_lg")
    print(f"✅ spacy: {spacy.__version__} + en_core_web_lg loaded")
except Exception as e:
    errors.append(f"❌ spacy: {e}")

try:
    import neo4j
    print(f"✅ neo4j: {neo4j.__version__}")
except Exception as e:
    errors.append(f"❌ neo4j: {e}")

try:
    from qdrant_client import QdrantClient
    print(f"✅ qdrant-client: imported")
except Exception as e:
    errors.append(f"❌ qdrant-client: {e}")

try:
    from sentence_transformers import SentenceTransformer
    print(f"✅ sentence-transformers: imported")
except Exception as e:
    errors.append(f"❌ sentence-transformers: {e}")

try:
    from langgraph.graph import StateGraph
    print(f"✅ langgraph: imported")
except Exception as e:
    errors.append(f"❌ langgraph: {e}")

try:
    from unstructured.partition.pdf import partition_pdf
    print(f"✅ unstructured: imported")
except Exception as e:
    errors.append(f"❌ unstructured: {e}")
    

try:
    import loguru
    print(f"✅ loguru: imported")
except Exception as e:
    errors.append(f"❌ loguru: {e}")

try:
    import httpx
    print(f"✅ httpx: {httpx.__version__}")
except Exception as e:
    errors.append(f"❌ httpx: {e}")

try:
    import dotenv
    print(f"✅ python-dotenv: imported")
except Exception as e:
    errors.append(f"❌ python-dotenv: {e}")

print("\n--- SUMMARY ---")
if errors:
    print(f"❌ {len(errors)} package(s) failed:")
    for e in errors:
        print(f"  {e}")
else:
    print("✅ All packages installed successfully. Ready to build.")
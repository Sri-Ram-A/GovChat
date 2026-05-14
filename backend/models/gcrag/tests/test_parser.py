import asyncio
import os
os.environ["HF_HOME"] = "D:/hf_cache"

from dotenv import load_dotenv
load_dotenv()

from retriever import _retrieve_answer_async

async def main():
    questions = [
        "What is the role of machine learning in AI governance?",
        "What are the limitations of existing e-governance systems?",
    ]
    for i, q in enumerate(questions):
        if i > 0:
            await asyncio.sleep(5)  # wait 5s between requests
        print(f"\n❓ {q}")
        result = await _retrieve_answer_async(q, top_k=1)
        print(f"💬 {result['answer']}")
        print(f"📊 Confidence: {result['confidence']:.4f}")
        print(f"📦 Graphs used: {result['graphs_used']}")

asyncio.run(main())
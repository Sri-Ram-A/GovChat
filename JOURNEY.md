git checkout -b gcrag origin/gcrag

# Srinidhi
PyMuPDF is the actual Python package/library.
It is a Python binding around the MuPDF engine. MuPDF is a very fast C library for:
- PDFs , EPUB , XPS
- fitz is the Python import name used by PyMuPDF.
```bash
cd backend/models/gcrag
micromamba install unstructured pdfplumber langgraph spacy pymupdf
pip install sentence-transformers
pip install neo4j
```
# First, uninstall the broken torch and torchvision
pip uninstall torch torchvision -y

# Now reinstall the correct versions together
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu132
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}'); print(f'CUDA version: {torch.version.cuda}')"
from unstructured.partition.pdf import partition_pdf
import pdfplumber
from loguru import logger
import os


def clean_text(text: str) -> str:
    """
    Clean text by removing potential headers, footers, and page numbers using heuristics.
    - Skip lines shorter than 5 characters
    - Skip lines that are all uppercase and shorter than 20 characters
    - Skip lines that are numeric only
    """
    if not text:
        return ""
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if len(line) < 5:
            continue
        if line.isupper() and len(line) < 20:
            continue
        if line.isdigit():
            continue
        cleaned_lines.append(line)
    return '\n'.join(cleaned_lines).strip()


def parse_document(file_path: str) -> list[dict]:
    """
    Parse a PDF document using unstructured.io as primary parser, with pdfplumber as fallback.

    Args:
        file_path (str): Path to the PDF file.

    Returns:
        list[dict]: List of dictionaries with keys: page_number, element_type, text.
                    element_type is one of: NarrativeText, Table, Title, ListItem.
    """
    if not os.path.exists(file_path):
        logger.error("File does not exist: {}", file_path)
        return []

    logger.info("Starting document parsing for: {}", file_path)

    try:
        logger.info("Attempting to parse with unstructured.io")
        elements = partition_pdf(filename=file_path)
        logger.info("Extracted {} elements from unstructured", len(elements))

        result = []
        for element in elements:
            if element.category in ["NarrativeText", "Table", "Title", "ListItem"]:
                if element.category == "Table" and hasattr(element.metadata, "text_as_html"):
                    text = clean_text(element.metadata.text_as_html or element.text)
                else:
                    text = clean_text(element.text)
                if text:  # Only include if text remains after cleaning
                    result.append({
                        "page_number": element.metadata.page_number or 0,
                        "element_type": element.category,
                        "text": text
                    })
        logger.info("Processed {} valid elements", len(result))
        return result

    except Exception as e:
        logger.warning("Unstructured parsing failed: {}, falling back to pdfplumber", str(e))
        try:
            with pdfplumber.open(file_path) as pdf:
                logger.info("Parsing with pdfplumber, {} pages", len(pdf.pages))
                result = []
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        text = clean_text(text)
                        if text:
                            result.append({
                                "page_number": i + 1,
                                "element_type": "NarrativeText",
                                "text": text
                            })
                logger.info("Extracted {} text blocks with pdfplumber", len(result))
                return result
        except Exception as e2:
            logger.error("Pdfplumber fallback also failed: {}", str(e2))
            return []
        

def get_full_text(elements: list[dict]) -> str:
    """
    Combine all parsed elements into one string for LLM ingestion.
    """
    parts = []
    for el in elements:
        parts.append(f"[{el['element_type']} | Page {el['page_number']}]\n{el['text']}")
    return "\n\n".join(parts)
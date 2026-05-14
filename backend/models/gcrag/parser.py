import os
import fitz
from loguru import logger


def clean_text(text: str) -> str:
    if not text:
        return ""

    lines = text.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        if len(line) < 5:
            continue

        if line.isupper() and len(line) < 20:
            continue

        if line.isdigit():
            continue

        cleaned.append(line)

    return "\n".join(cleaned).strip()


def parse_document(file_path: str) -> list[dict]:
    logger.info("Starting PDF parsing: {}", file_path)

    if not os.path.exists(file_path):
        logger.error("File does not exist: {}", file_path)
        return []

    result = []

    try:
        with fitz.open(file_path) as doc:
            logger.info("Opened PDF successfully: {} pages found", len(doc))

            for page_num, page in enumerate(doc, start=1):
                try:
                    raw_text = page.get_text()
                    cleaned_text = clean_text(raw_text)

                    if not cleaned_text:
                        logger.debug("Page {}: no useful text extracted", page_num)
                        continue

                    result.append(
                        {
                            "page_number": page_num,
                            "element_type": "NarrativeText",
                            "text": cleaned_text,
                        }
                    )

                    logger.debug(
                        "Page {}: extracted {} characters",
                        page_num,
                        len(cleaned_text),
                    )

                except Exception as page_error:
                    logger.warning(
                        "Failed to parse page {} in {}: {}",
                        page_num,
                        file_path,
                        page_error,
                    )

        logger.info(
            "Completed parsing {}. Extracted {} text blocks", file_path, len(result)
        )
        return result

    except Exception as e:
        logger.exception("Parsing failed for {}: {}", file_path, e)
        return []

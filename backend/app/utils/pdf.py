import io

import fitz
import pytesseract

from PIL import Image


def extract_pdf_text(pdf_file):
    """
    Extract text from PDF.

    1. Try normal text extraction using PyMuPDF.
    2. If no text exists, use OCR with Tesseract.
    """

    pdf_file.seek(0)

    pdf_bytes = pdf_file.read()

    document = fitz.open(stream=pdf_bytes, filetype="pdf")

    text = ""

    # -----------------------------
    # Normal PDF extraction
    # -----------------------------

    for page in document:
        text += page.get_text("text")

    # If normal extraction worked
    if text.strip():
        print("✅ Text extracted using PyMuPDF")
        document.close()
        return text.strip()

    # -----------------------------
    # OCR Fallback
    # -----------------------------

    print("⚠ No selectable text found.")
    print("Running OCR...")

    text = ""

    for page in document:

        # High quality image
        pix = page.get_pixmap(dpi=300)

        image = Image.open(
            io.BytesIO(
                pix.tobytes("png")
            )
        )

        page_text = pytesseract.image_to_string(image)

        text += page_text + "\n"

    document.close()

    print("OCR Complete")
    print("Characters extracted:", len(text))

    return text.strip()
import io
import fitz

def extract_pdf_text(pdf_file) -> str:
    """
    Extract text from an uploaded PDF.
    1. Try high-performance text extraction using PyMuPDF (fitz).
    2. If normal extraction yields minimal text, attempt OCR if pytesseract is available.
    """
    try:
        pdf_file.seek(0)
        pdf_bytes = pdf_file.read()
    except Exception as e:
        print(f"Error reading file bytes: {e}")
        return ""

    text = ""
    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in document:
            text += page.get_text("text") + "\n"
        document.close()
    except Exception as e:
        print(f"PyMuPDF extraction error: {e}")

    cleaned_text = text.strip()
    if cleaned_text:
        print(f"Extracted {len(cleaned_text)} characters using PyMuPDF")
        return cleaned_text

    # OCR Fallback
    try:
        import pytesseract
        from PIL import Image

        print("No selectable text found, trying OCR fallback...")
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
        ocr_text = ""
        for page in document:
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            page_text = pytesseract.image_to_string(img)
            ocr_text += page_text + "\n"
        document.close()
        return ocr_text.strip()
    except Exception as ocr_err:
        print(f"OCR not available or failed: {ocr_err}")
        return cleaned_text

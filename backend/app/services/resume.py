from app.utils.pdf import extract_pdf_text
from app.services.resume_analysis import analyze_resume


def process_resume(pdf_file):
    """
    Extract text from the uploaded PDF and analyze it with Gemini.
    """

    # Extract text using PyMuPDF + OCR
    text = extract_pdf_text(pdf_file)

    # Analyze resume using Gemini
    analysis = analyze_resume(text)

    return analysis
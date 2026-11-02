from typing import Dict, Any

def calculate_readiness_badge(score: int) -> Dict[str, str]:
    """Helper to return placement readiness status and UI theme color."""
    if score >= 85:
        return {
            "status": "Placement Ready - High Probability",
            "tier": "Advanced",
            "color": "success"
        }
    elif score >= 70:
        return {
            "status": "Good Progress - Fine Tuning Recommended",
            "tier": "Intermediate",
            "color": "primary"
        }
    else:
        return {
            "status": "Foundation Building - Further Practice Needed",
            "tier": "Beginner",
            "color": "warning"
        }

def sanitize_text(text: str) -> str:
    """Strip out extraneous whitespace and markdown artifacts."""
    if not text:
        return ""
    return " ".join(text.strip().split())

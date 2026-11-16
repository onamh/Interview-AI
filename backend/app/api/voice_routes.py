from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

from app.services.transcription import (
    get_transcription_service,
    TranscriptionConfigError,
    TranscriptionFormatError,
    TranscriptionError,
)

router = APIRouter(tags=["Voice & Audio"])


class TranscriptionResponse(BaseModel):
    transcript: str


# Common audio extensions and mime types accepted from browser MediaRecorder
ALLOWED_EXTENSIONS = {
    ".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg", ".opus", ".aac", ".flac"
}


@router.post(
    "/voice/transcribe",
    response_model=TranscriptionResponse,
    summary="Transcribe candidate audio using OpenAI Whisper",
    description="Accepts an audio recording from browser MediaRecorder, verifies validity, and returns transcribed text.",
)
def transcribe_voice_audio(file: UploadFile = File(...)):
    # 1. Validate file presence
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio file was received. Please record your answer and try again."
        )

    filename = file.filename or "recording.webm"
    content_type = file.content_type or ""

    # Basic format check
    lower_name = filename.lower()
    has_valid_ext = any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    has_valid_mime = content_type.startswith("audio/") or content_type == "application/octet-stream"

    if not has_valid_ext and not has_valid_mime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format ('{content_type}'). Please use standard browser audio recording."
        )

    # 2. Read audio payload and enforce size constraints
    try:
        audio_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded audio stream: {str(e)}"
        )

    # Empty recording check (below 100 bytes is essentially an empty header or 0-frame recording)
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The audio recording is empty or was stopped before speaking. Please speak your answer and try again."
        )

    # 25MB Whisper limit check
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio recording exceeds the maximum size limit of 25MB. Please provide a shorter response."
        )

    # 3. Transcribe via Whisper service
    try:
        service = get_transcription_service()
        raw_transcript = service.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
        )
    except TranscriptionConfigError as e:
        # Credential or configuration issue on backend
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except TranscriptionFormatError as e:
        # Invalid audio encoding or corrupt payload
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except TranscriptionError as e:
        # External Whisper API issue (rate limit, connection, server error)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio transcription encountered an unexpected error: {str(e)}"
        )

    transcript = raw_transcript.strip()

    # 4. Check for empty transcription (speech undetected / silent room)
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No speech could be detected in your recording. Please speak clearly into your microphone and try again."
        )

    return TranscriptionResponse(transcript=transcript)

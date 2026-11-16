import io
import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from app.config import (
    WHISPER_BACKEND,
    WHISPER_MODEL,
    OPENAI_API_KEY,
)


# ==================================================
# Custom Exceptions for Structured Error Handling
# ==================================================

class TranscriptionError(Exception):
    """Base exception for transcription failures."""
    pass


class TranscriptionConfigError(TranscriptionError):
    """Raised when configuration or authentication credentials are invalid or missing."""
    pass


class TranscriptionFormatError(TranscriptionError):
    """Raised when audio format or payload is invalid or unsupported."""
    pass


# ==================================================
# Abstract Base Transcription Service
# (Modular interface for future STT providers)
# ==================================================

class BaseTranscriptionService(ABC):
    @abstractmethod
    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        content_type: Optional[str] = None
    ) -> str:
        """
        Transcribe raw audio bytes into text.
        """
        pass


# ==================================================
# 1. 100% Free Local Whisper Service (faster-whisper)
# (Zero API Key, Zero Cost, Completely Offline)
# ==================================================

class LocalWhisperService(BaseTranscriptionService):
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or WHISPER_MODEL or "tiny"
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
            except ImportError as e:
                raise TranscriptionConfigError(
                    "faster-whisper is not installed. Please install with: pip install faster-whisper av<14"
                ) from e

            # Check if pre-cached model folder exists in backend/app/whisper_models
            base_app_dir = Path(__file__).resolve().parent.parent
            local_model_dir = base_app_dir / "whisper_models" / self.model_name

            target = str(local_model_dir) if local_model_dir.exists() else self.model_name

            try:
                self._model = WhisperModel(
                    target,
                    device="cpu",
                    compute_type="int8",
                )
            except Exception as e:
                raise TranscriptionError(
                    f"Failed to load local Whisper model ('{self.model_name}'): {str(e)}"
                ) from e

        return self._model

    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        content_type: Optional[str] = None
    ) -> str:
        if not audio_bytes or len(audio_bytes) < 100:
            raise TranscriptionFormatError(
                "The received audio recording is empty or too short. Please speak clearly and try again."
            )

        # Enforce 25 MB max limit
        max_bytes = 25 * 1024 * 1024
        if len(audio_bytes) > max_bytes:
            raise TranscriptionFormatError(
                f"Audio file exceeds the maximum size limit of 25MB (received {len(audio_bytes) / (1024*1024):.1f}MB)."
            )

        model = self._get_model()

        try:
            # PyAV natively decodes WebM, MP4, WAV, OGG from BytesIO
            stream = io.BytesIO(audio_bytes)
            segments, info = model.transcribe(
                stream,
                beam_size=1,
                language=None,  # Auto-detect speech language (or defaults to English/Hindi)
            )

            # Assemble transcribed segments into full text
            transcript_parts = []
            for seg in segments:
                if seg.text:
                    transcript_parts.append(seg.text.strip())

            return " ".join(transcript_parts).strip()
        except Exception as e:
            raise TranscriptionError(
                f"Local Whisper transcription failed: {str(e)}"
            ) from e


# ==================================================
# 2. OpenAI Whisper Cloud API Service
# (Optional fallback for users with paid OpenAI keys)
# ==================================================

class OpenAIWhisperService(BaseTranscriptionService):
    SUPPORTED_EXTENSIONS = {
        ".flac", ".mp3", ".mp4", ".mpeg", ".mpga",
        ".m4a", ".ogg", ".wav", ".webm"
    }

    MIME_MAP = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/wave": ".wav",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".mp4",
        "audio/m4a": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/aac": ".m4a",
        "audio/ogg": ".ogg",
        "audio/opus": ".ogg",
        "audio/flac": ".flac",
    }

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or OPENAI_API_KEY
        self.model = model or "whisper-1"
        self._client = None

    def _get_client(self):
        if not self.api_key or not self.api_key.strip():
            raise TranscriptionConfigError(
                "OpenAI API key is missing. Set OPENAI_API_KEY in backend/.env or switch to free local Whisper by setting WHISPER_BACKEND=local."
            )
        if self._client is None:
            import openai
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key.strip())
        return self._client

    def _resolve_filename(self, filename: str, content_type: Optional[str]) -> str:
        clean_name = os.path.basename(filename or "recording.webm")
        base, ext = os.path.splitext(clean_name)
        ext = ext.lower()

        if ext in self.SUPPORTED_EXTENSIONS:
            return clean_name

        if content_type:
            pure_mime = content_type.split(";")[0].strip().lower()
            mapped_ext = self.MIME_MAP.get(pure_mime)
            if mapped_ext:
                return f"{base or 'recording'}{mapped_ext}"

        return f"{base or 'recording'}.webm"

    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        content_type: Optional[str] = None
    ) -> str:
        if not audio_bytes or len(audio_bytes) < 100:
            raise TranscriptionFormatError(
                "The received audio recording is empty or too short. Please speak clearly and try again."
            )

        max_bytes = 25 * 1024 * 1024
        if len(audio_bytes) > max_bytes:
            raise TranscriptionFormatError(
                f"Audio file exceeds the maximum size limit of 25MB (received {len(audio_bytes) / (1024*1024):.1f}MB)."
            )

        import openai
        client = self._get_client()
        target_filename = self._resolve_filename(filename, content_type)
        mime = content_type.split(";")[0].strip() if content_type else "audio/webm"

        file_tuple = (target_filename, io.BytesIO(audio_bytes), mime)

        try:
            response = client.audio.transcriptions.create(
                model=self.model,
                file=file_tuple,
            )
            if hasattr(response, "text"):
                return response.text.strip()
            elif isinstance(response, dict):
                return str(response.get("text", "")).strip()
            return str(response).strip()
        except openai.AuthenticationError as e:
            raise TranscriptionConfigError(
                "OpenAI authentication failed. Please verify your OPENAI_API_KEY in backend/.env, or set WHISPER_BACKEND=local to use the free local Whisper."
            ) from e
        except openai.RateLimitError as e:
            raise TranscriptionError(
                "OpenAI Whisper rate limit or quota exceeded. Please check your billing or switch to free local Whisper by setting WHISPER_BACKEND=local."
            ) from e
        except openai.APIConnectionError as e:
            raise TranscriptionError(
                "Network connection error: Unable to reach OpenAI Whisper API. Please check your internet connection."
            ) from e
        except openai.BadRequestError as e:
            raise TranscriptionFormatError(
                f"OpenAI Whisper rejected the audio file: {e.message}"
            ) from e
        except openai.OpenAIError as e:
            raise TranscriptionError(
                f"OpenAI Whisper service error: {str(e)}"
            ) from e
        except Exception as e:
            raise TranscriptionError(
                f"Unexpected transcription failure: {str(e)}"
            ) from e


# ==================================================
# Service Factory
# ==================================================

_default_service: Optional[BaseTranscriptionService] = None


def get_transcription_service() -> BaseTranscriptionService:
    global _default_service
    if _default_service is None:
        backend_choice = (WHISPER_BACKEND or "local").strip().lower()
        if backend_choice == "openai":
            _default_service = OpenAIWhisperService()
        else:
            # Default to 100% Free Local Whisper
            _default_service = LocalWhisperService()
    return _default_service

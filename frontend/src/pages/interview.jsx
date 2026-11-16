import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { nextQuestion, transcribeAudio } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  User,
  Lightbulb,
  AlertCircle,
  Clock,
  LogOut,
  Mic,
  Square,
  RotateCcw,
  Keyboard,
  Loader2,
  Edit3,
} from "lucide-react";

function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [question, setQuestion] = useState(
    state?.question || "Can you explain your technical background and key projects?"
  );
  const [currentQuestion, setCurrentQuestion] = useState(state?.current_question || 1);
  const [totalQuestions] = useState(state?.total_questions || 5);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Answer Mode: 'voice' | 'text'
  const [answerMode, setAnswerMode] = useState("voice");

  // Voice recording state: 'idle' | 'recording' | 'transcribing' | 'transcribed'
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceError, setVoiceError] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");

  // Refs for media recording lifecycle
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordTimerRef = useRef(null);

  // Overall session elapsed timer
  const [seconds, setSeconds] = useState(0);

  // End early confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Overall interview timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup media recording streams on unmount
  useEffect(() => {
    return () => {
      stopAudioStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const stopAudioStream = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("MediaRecorder stop warning:", err);
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  // Start audio recording with browser MediaRecorder
  const startRecording = async () => {
    if (loading) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      return; // Prevent multiple simultaneous recordings
    }

    setVoiceError("");
    setVoiceNotice("");
    setErrorMessage("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError(
        "Microphone access is not supported by your browser or requires a secure HTTPS or localhost origin."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Select browser-supported audio mime type
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        setVoiceError("Audio recording encountered an error. Please try again.");
        stopAudioStream();
        setRecordingStatus("idle");
      };

      // Collect audio chunks every 250ms for responsive data gathering
      recorder.start(250);
      setRecordingStatus("recording");
      setRecordingDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          // Auto-stop at 3 minutes (180s)
          if (prev >= 180) {
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      stopAudioStream();
      setRecordingStatus("idle");

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceError(
          "Microphone permission was denied. Please allow microphone access in your browser settings to record your answer."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setVoiceError("No microphone was detected on your device. Please plug in or enable a microphone.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setVoiceError(
          "Your microphone is currently in use by another application. Please close other audio applications and try again."
        );
      } else {
        setVoiceError(err.message || "Failed to access microphone. Please check your system settings.");
      }
    }
  };

  // Stop recording and send audio to FastAPI Whisper endpoint
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      // Turn off microphone tracks immediately so hardware LED turns off
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      const actualMime = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
      audioChunksRef.current = [];

      // Check if user stopped recording before speaking or recording was too brief
      if (recordingDuration < 1 && audioBlob.size < 500) {
        setVoiceError(
          "Recording was stopped before any speech was captured. Please speak your answer clearly and try again."
        );
        setRecordingStatus("idle");
        return;
      }

      // Generate local playback URL for user confirmation
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);

      // Begin Whisper transcription phase
      setRecordingStatus("transcribing");
      setVoiceError("");
      setVoiceNotice("");

      try {
        let ext = ".webm";
        if (actualMime.includes("mp4")) ext = ".mp4";
        else if (actualMime.includes("ogg")) ext = ".ogg";
        else if (actualMime.includes("wav")) ext = ".wav";

        const data = await transcribeAudio(audioBlob, `candidate_recording${ext}`);
        const transcript = (data?.transcript || "").trim();

        if (!transcript) {
          setVoiceError(
            "No speech could be detected in your recording. Please ensure your microphone is working and speak clearly."
          );
          setRecordingStatus("idle");
          return;
        }

        // Set the transcribed answer into the editable answer state
        setAnswer(transcript);
        setRecordingStatus("transcribed");

        // Provide guidance if the answer is concise
        const words = transcript.split(/\s+/).filter(Boolean).length;
        if (words < 12) {
          setVoiceNotice(
            "Notice: Your transcribed answer seems quite brief. Consider reviewing and elaborating on technical details below before submitting."
          );
        } else {
          setVoiceNotice(
            "Speech transcribed successfully! Feel free to review, edit, or elaborate on your answer before submitting."
          );
        }
      } catch (err) {
        console.error("Transcription error:", err);
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to transcribe audio with Whisper. Please check your network connection or switch to typing.";
        setVoiceError(errorDetail);
        setRecordingStatus("idle");
      }
    };

    try {
      recorder.stop();
    } catch (err) {
      console.error("Error stopping recorder:", err);
    }
  };

  // Reset recording to allow user to retry recording
  const handleRetryRecording = () => {
    stopAudioStream();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingStatus("idle");
    setRecordingDuration(0);
    setVoiceError("");
    setVoiceNotice("");
  };

  // Submit answer and proceed to next question or evaluation
  const handleNext = async () => {
    if (loading) return;

    if (recordingStatus === "recording") {
      setErrorMessage("Please stop your audio recording before submitting your answer.");
      return;
    }

    if (recordingStatus === "transcribing") {
      setErrorMessage("Please wait for Whisper audio transcription to complete.");
      return;
    }

    const trimmed = answer.trim();
    if (!trimmed) {
      setErrorMessage(
        answerMode === "voice"
          ? "Please record your answer using the microphone or switch to 'Type Answer' before submitting."
          : "Please type an answer before moving to the next question."
      );
      return;
    }

    setErrorMessage("");
    setVoiceError("");
    setLoading(true);

    try {
      const response = await nextQuestion(sessionId, trimmed);

      if (response.finished) {
        const history = JSON.parse(localStorage.getItem("interviewHistory")) || [];

        const interviewItem = {
          id: sessionId,
          role: state?.role || "Software Engineer",
          language: state?.language || "Technical",
          difficulty: state?.difficulty || "Medium",
          total_questions: totalQuestions,
          overall_score: response.evaluation.overall_score,
          technical_score: response.evaluation.technical_score,
          communication_score: response.evaluation.communication_score,
          clarity_score: response.evaluation.clarity_score,
          structure_score: response.evaluation.structure_score,
          confidence_score: response.evaluation.confidence_score,
          strengths: response.evaluation.strengths,
          weaknesses: response.evaluation.weaknesses,
          suggestions: response.evaluation.suggestions,
          overall_feedback: response.evaluation.overall_feedback,
          question_reviews: response.evaluation.question_reviews || [],
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };

        history.unshift(interviewItem);
        localStorage.setItem("interviewHistory", JSON.stringify(history));

        navigate("/evaluation", {
          state: {
            evaluation: response.evaluation,
            role: state?.role,
            language: state?.language,
            difficulty: state?.difficulty,
            total_questions: totalQuestions,
          },
        });
        return;
      }

      // Advance to next question and reset input states
      setQuestion(response.question);
      setCurrentQuestion(response.current_question);
      setAnswer("");
      handleRetryRecording();
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Error processing answer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.round((currentQuestion / totalQuestions) * 100);
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Session Status Bar */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#f7f5f0] text-[#171717] border border-[#e8e4dc]">
              {state?.role || "Technical Role"}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f7f5f0] text-[#57534e]">
              Level: {state?.difficulty || "Medium"}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#f7f5f0] text-[#57534e]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(seconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 min-w-[220px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-[#78716c] mb-1">
                <span>
                  Question <strong>{currentQuestion}</strong> of {totalQuestions}
                </span>
                <span className="font-bold text-[#171717]">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#f0ece3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#171717] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="p-1.5 text-[#a8a29e] hover:text-rose-600 transition-colors"
              title="End Interview"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* AI Interviewer Question Card */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ece3]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold">
                <Bot className="w-5 h-5 text-[#f7f5f0]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">Interview AI</h3>
                <span className="text-xs text-[#78716c]">Active Question Prompt</span>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f7f5f0] text-[#57534e] border border-[#e8e4dc]">
              Question {currentQuestion} / {totalQuestions}
            </span>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <p className="text-lg sm:text-xl font-medium text-[#171717] leading-relaxed">
              {question}
            </p>
          </div>

          {/* Tip Note */}
          <div className="bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#57534e]">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#171717]">Recommendation: </span>
              <span>
                Explain core principles clearly, provide concise examples, and mention trade-offs or
                alternatives if applicable.
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Response Card */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0ece3]">
            <div className="flex items-center gap-2 text-[#171717] font-bold text-sm">
              <User className="w-4 h-4 text-[#171717]" />
              <span>Your Answer</span>
            </div>

            {/* Answer Mode Tabs: Type Answer vs Answer by Voice */}
            <div className="flex items-center bg-[#f0ece3] p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAnswerMode("voice")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  answerMode === "voice"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#78716c] hover:text-[#171717]"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>Answer by Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setAnswerMode("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  answerMode === "text"
                    ? "bg-white text-[#171717] shadow-xs"
                    : "text-[#78716c] hover:text-[#171717]"
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Type Answer</span>
              </button>
            </div>
          </div>

          {/* Voice-Specific Alerts & Guidance */}
          {voiceError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{voiceError}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceError("")}
                className="text-rose-500 hover:text-rose-700 font-bold ml-2 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {voiceNotice && (
            <div className="bg-amber-50/80 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-2 text-xs">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{voiceNotice}</span>
            </div>
          )}

          {/* VOICE MODE INTERFACE */}
          {answerMode === "voice" && (
            <div className="space-y-4">
              {/* Voice State: Idle */}
              {recordingStatus === "idle" && (
                <div className="bg-[#f7f5f0] border border-[#e8e4dc] rounded-2xl p-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-[#e8e4dc] text-[#171717] shadow-xs">
                    <Mic className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4 text-rose-400" />
                      <span>Start Recording</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Voice State: Recording */}
              {recordingStatus === "recording" && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-semibold shadow-xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                    <span>Recording in progress • {formatTimer(recordingDuration)}</span>
                  </div>

                  {/* Animated audio waveform visualization */}
                  <div className="flex items-center justify-center gap-1.5 h-8">
                    <span className="w-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-4"></span>
                    <span className="w-1.5 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s] h-7"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0s] h-5"></span>
                    <span className="w-1.5 bg-rose-600 rounded-full animate-bounce [animation-delay:0.15s] h-8"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.3s] h-4"></span>
                  </div>

                  <p className="text-xs text-[#57534e]">
                    Speak clearly into your microphone. Click <strong>Stop Recording</strong> when you
                    finish your answer.
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Recording</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Voice State: Transcribing */}
              {recordingStatus === "transcribing" && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-[#171717]">
                      Transcribing speech with OpenAI Whisper...
                    </h4>
                    <p className="text-xs text-[#78716c] mt-1">
                      Converting your audio into text. This usually completes in just a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Voice State: Transcribed Confirmation Card */}
              {recordingStatus === "transcribed" && (
                <div className="bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#171717] block">
                        Voice Answer Transcribed
                      </span>
                      <span className="text-[11px] text-[#78716c]">
                        Review and edit your answer below before final submission
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {audioUrl && (
                      <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                    )}
                    <button
                      type="button"
                      onClick={handleRetryRecording}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#57534e] bg-white border border-[#e8e4dc] hover:bg-[#ede8df] transition-all cursor-pointer"
                      title="Re-record your voice answer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-record</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Answer Area for Voice Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#57534e]">
                  <span className="font-semibold flex items-center gap-1.5 text-[#171717]">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Transcribed Answer (Editable)</span>
                  </span>
                  <span className="text-[11px] text-[#78716c]">
                    You can edit or expand this text before submitting
                  </span>
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={
                    loading ||
                    recordingStatus === "recording" ||
                    recordingStatus === "transcribing"
                  }
                  rows={6}
                  placeholder="Your transcribed answer will appear here. You can also edit it directly..."
                  className="w-full rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] p-4 text-sm text-[#171717] placeholder:text-[#a8a29e] focus:outline-hidden focus:border-[#171717] leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {/* TEXT MODE INTERFACE */}
          {answerMode === "text" && (
            <div className="space-y-2">
              <div className="text-xs text-[#78716c]">
                <span>Type your structured technical answer below:</span>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading}
                rows={7}
                placeholder="Type your answer here in detail..."
                className="w-full rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] p-4 text-sm text-[#171717] placeholder:text-[#a8a29e] focus:outline-hidden focus:border-[#171717] leading-relaxed resize-y"
              />
            </div>
          )}

          {/* Bottom Bar: Word Counts & Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 text-xs text-[#78716c] font-medium">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{answer.length} characters</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                loading ||
                recordingStatus === "recording" ||
                recordingStatus === "transcribing"
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                "Evaluating & Loading Next Question..."
              ) : currentQuestion === totalQuestions ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit & View Evaluation</span>
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
              <h3 className="text-base font-bold text-[#171717]">End Interview Early?</h3>
              <p className="text-xs text-[#57534e]">
                Your answered questions will be evaluated, but remaining questions will not be
                completed.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-[#57534e] bg-[#f7f5f0] hover:bg-[#ede8df] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 cursor-pointer"
                >
                  Confirm Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Interview;

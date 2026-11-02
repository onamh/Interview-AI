import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { nextQuestion } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import "./interview.css";

function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [question, setQuestion] = useState(
    state?.question || "Can you explain your technical background and key projects?"
  );
  const [currentQuestion, setCurrentQuestion] = useState(
    state?.current_question || 1
  );
  const [totalQuestions] = useState(state?.total_questions || 5);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Speech Recognition (Speech-to-Text) state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Speech Synthesis (Text-to-Speech) state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(true);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setAnswer((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech reader for questions
  const speakQuestion = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))) || v.lang.startsWith("en")
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (autoSpeechEnabled && question) {
      const timer = setTimeout(() => {
        speakQuestion(question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [question, autoSpeechEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge, or type your answer.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        stopSpeaking();
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech start error:", err);
        setIsListening(false);
      }
    }
  };

  const handleNext = async () => {
    if (loading) return;

    if (!answer.trim()) {
      setErrorMessage("Please type or speak your answer before continuing.");
      return;
    }

    setErrorMessage("");
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopSpeaking();
    setLoading(true);

    try {
      const response = await nextQuestion(sessionId, answer);

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
          strengths: response.evaluation.strengths,
          weaknesses: response.evaluation.weaknesses,
          suggestions: response.evaluation.suggestions,
          overall_feedback: response.evaluation.overall_feedback,
          question_reviews: response.evaluation.question_reviews || [],
          date: new Date().toLocaleString(),
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

      setQuestion(response.question);
      setCurrentQuestion(response.current_question);
      setAnswer("");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || "Error processing answer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentQuestion / totalQuestions) * 100;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="interview-room-container">
      {/* Top Session Status Bar */}
      <div className="interview-top-bar">
        <div className="session-badges">
          <span className="badge role-badge">{state?.role || "Interview"}</span>
          <span className="badge tech-badge">{state?.language || "Core CS"}</span>
          <span className="badge diff-badge">{state?.difficulty || "Standard"}</span>
        </div>

        <div className="question-stepper">
          <span className="step-text">
            Question <strong>{currentQuestion}</strong> of {totalQuestions}
          </span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="interview-error-alert">{errorMessage}</div>
      )}

      {/* Main Interview Stage */}
      <div className="interview-stage-grid">
        {/* Left / Top: AI Interviewer Card */}
        <div className="interviewer-card">
          <div className="interviewer-header">
            <div className={`interviewer-avatar ${isSpeaking ? "speaking-wave" : ""}`}>
              <div className="avatar-pulse"></div>
              <span>🤖</span>
            </div>
            <div className="interviewer-info">
              <h3>AI Technical Interviewer</h3>
              <span className="ai-status">
                {isSpeaking ? "Speaking question..." : "Waiting for candidate response"}
              </span>
            </div>

            <div className="voice-controls">
              {isSpeaking ? (
                <button
                  type="button"
                  className="btn-tts-toggle stop"
                  onClick={stopSpeaking}
                  title="Stop audio playback"
                >
                  ⏹ Stop Voice
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-tts-toggle play"
                  onClick={() => speakQuestion(question)}
                  title="Read question aloud"
                >
                  🔊 Listen to Question
                </button>
              )}
            </div>
          </div>

          <div className="question-box">
            <p className="question-text">{question}</p>
          </div>

          <div className="coaching-hint">
            <span className="hint-icon">💡</span>
            <span className="hint-text">
              <strong>Interview Tip:</strong> Be concise yet comprehensive. Discuss implementation details, design trade-offs, and how you handle real-world edge cases.
            </span>
          </div>
        </div>

        {/* Right / Bottom: Candidate Response Area */}
        <div className="candidate-answer-card">
          <div className="answer-header">
            <h3>Your Response</h3>

            <div className="audio-voice-actions">
              {speechSupported && (
                <button
                  type="button"
                  className={`btn-mic-toggle ${isListening ? "active-listening" : ""}`}
                  onClick={toggleListening}
                >
                  {isListening ? (
                    <>
                      <span className="rec-dot"></span>
                      Listening... (Click to Stop)
                    </>
                  ) : (
                    <>
                      🎙️ Speak Answer (Voice)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {isListening && (
            <div className="listening-indicator-banner">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span>Microphone active — speak clearly, your words are transcribing live into the answer box below.</span>
            </div>
          )}

          <textarea
            className="answer-textarea"
            placeholder="Type your answer here, or click 'Speak Answer (Voice)' to dictate via your microphone..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={loading}
            rows={8}
          />

          <div className="answer-footer">
            <div className="metrics-counter">
              <span>{wordCount} words</span>
              <span className="divider">•</span>
              <span>{answer.length} characters</span>
            </div>

            <button
              className="btn-submit-answer"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                "AI is Evaluating & Advancing..."
              ) : currentQuestion === totalQuestions ? (
                "🏁 Finish Interview & Generate Rubric Report →"
              ) : (
                "Next Question →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Interview;

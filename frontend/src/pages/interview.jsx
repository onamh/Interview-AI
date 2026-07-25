import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { nextQuestion } from "../api/interviewApi";
import "./Interview.css";

function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [question, setQuestion] = useState(state?.question || "");
  const [currentQuestion, setCurrentQuestion] = useState(
    state?.current_question || 1
  );
  const [totalQuestions] = useState(state?.total_questions || 5);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = (currentQuestion / totalQuestions) * 100;

  const handleNext = async () => {
    if (loading) return;

    if (!answer.trim()) {
      alert("Please enter your answer.");
      return;
    }

    setLoading(true);

    try {
      const response = await nextQuestion(sessionId, answer);

      // ===========================
      // Interview Finished
      // ===========================

      if (response.finished) {
        const history =
          JSON.parse(localStorage.getItem("interviewHistory")) || [];

        history.unshift({
          role: state?.role || "Interview",
          language: state?.language || "N/A",
          difficulty: state?.difficulty || "N/A",
          total_questions: totalQuestions,
          overall_score: response.evaluation.overall_score,
          date: new Date().toLocaleString(),
        });

        localStorage.setItem(
          "interviewHistory",
          JSON.stringify(history)
        );

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

      // ===========================
      // Next Question
      // ===========================

      setQuestion(response.question);
      setCurrentQuestion(response.current_question);
      setAnswer("");
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-container">
      <h1>AI Interview</h1>

      {/* Progress */}

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{
            width: `${progress}%`,
          }}
        ></div>
      </div>

      <p className="progress-text">
        Question {currentQuestion} of {totalQuestions}
      </p>

      {/* Question */}

      <div className="question-card">
        <h3>Interview Question</h3>

        <p className="question">{question}</p>
      </div>

      {/* Answer */}

      <textarea
        className="answer-box"
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={loading}
      />

      <p className="character-count">
        {answer.length} characters
      </p>

      {/* Button */}

      <button
        className="next-btn"
        onClick={handleNext}
        disabled={loading}
      >
        {loading
          ? "AI is thinking..."
          : currentQuestion === totalQuestions
          ? "Finish Interview"
          : "Next Question"}
      </button>
    </div>
  );
}

export default Interview;
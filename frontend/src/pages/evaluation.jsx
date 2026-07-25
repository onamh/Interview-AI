import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Evaluation.css";

function Evaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const evaluation = state?.evaluation;
  useEffect(() => {
  if (!evaluation) return;

  const previous =
    JSON.parse(localStorage.getItem("interviewHistory")) || [];

  const interview = {
    date: new Date().toLocaleString(),
    role: state?.role || "Unknown",
    language: state?.language || "Unknown",
    score: evaluation.overall_score,
    technical: evaluation.technical_score,
    communication: evaluation.communication_score,
  };

  previous.unshift(interview);

  localStorage.setItem(
    "interviewHistory",
    JSON.stringify(previous)
  );
}, []);

  if (!evaluation) {
    return (
      <div className="evaluation-container">
        <h2>No evaluation found.</h2>

        <button onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="evaluation-container">

      <h1>Interview Evaluation</h1>

      {/* Scores */}

      <div className="score-grid">

        <div className="score-card">
          <h3>Overall Score</h3>
          <p>{evaluation.overall_score}/100</p>
        </div>

        <div className="score-card">
          <h3>Technical</h3>
          <p>{evaluation.technical_score}/100</p>
        </div>

        <div className="score-card">
          <h3>Communication</h3>
          <p>{evaluation.communication_score}/100</p>
        </div>

      </div>

      {/* Strengths */}

      <div className="section">
        <h2>Strengths</h2>

        <ul>
          {evaluation.strengths.map((item, index) => (
            <li key={index}>✅ {item}</li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}

      <div className="section">
        <h2>Areas to Improve</h2>

        <ul>
          {evaluation.weaknesses.map((item, index) => (
            <li key={index}>❌ {item}</li>
          ))}
        </ul>
      </div>

      {/* Suggestions */}

      <div className="section">
        <h2>Suggestions</h2>

        <ul>
          {evaluation.suggestions.map((item, index) => (
            <li key={index}>💡 {item}</li>
          ))}
        </ul>
      </div>

      {/* Feedback */}

      <div className="section">

        <h2>Overall Feedback</h2>

        <p>{evaluation.overall_feedback}</p>

      </div>

      <button
        className="dashboard-btn"
        onClick={() => navigate("/")}
      >
        Back to Dashboard
      </button>

    </div>
  );
}

export default Evaluation;
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./evaluation.css";

function Evaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const evaluation = state?.evaluation;
  const role = state?.role || "Software Engineer";
  const language = state?.language || "Core Tech";
  const difficulty = state?.difficulty || "Medium";
  const totalQuestions = state?.total_questions || 5;

  if (!evaluation) {
    return (
      <div className="evaluation-page">
        <div className="empty-evaluation-card">
          <h2>No Evaluation Session Found</h2>
          <p>Please complete a mock interview session to view your performance report.</p>
          <button className="btn-primary" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overall = evaluation.overall_score || 75;
  const technical = evaluation.technical_score || overall;
  const communication = evaluation.communication_score || overall;

  const getVerdict = (score) => {
    if (score >= 85) return { title: "Campus Placement Ready!", class: "ready", desc: "Strong conceptual clarity and articulate responses." };
    if (score >= 70) return { title: "Good Progress - Fine Tuning Recommended", class: "progress", desc: "Solid foundation; polish edge cases and architecture." };
    return { title: "Foundation Building - Further Practice Needed", class: "needs-work", desc: "Revise core concepts and practice structured answering." };
  };

  const verdict = getVerdict(overall);
  const questionReviews = evaluation.question_reviews || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="evaluation-page">
      {/* Top Action Bar (Print / Retake / Dashboard) */}
      <div className="report-action-bar no-print">
        <button className="btn-action-back" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="action-buttons-right">
          <button className="btn-action-print" onClick={handlePrint}>
            🖨️ Print / Save PDF Report
          </button>
          <button className="btn-action-retake" onClick={() => navigate("/setup")}>
            + Start Another Interview
          </button>
        </div>
      </div>

      {/* Main Scorecard Banner */}
      <div className={`evaluation-hero-banner ${verdict.class}`}>
        <div className="banner-top">
          <span className="verdict-tag">{verdict.title}</span>
          <span className="session-tag">{role} • {language} ({difficulty})</span>
        </div>
        <h1>Candidate Mock Interview Rubric Report</h1>
        <p className="verdict-desc">{verdict.desc}</p>
      </div>

      {/* 3 Metric Score Gauges */}
      <div className="score-metrics-grid">
        <div className="score-metric-card primary">
          <div className="metric-circle">
            <span className="score-number">{overall}</span>
            <span className="score-max">/100</span>
          </div>
          <h3>Overall Score</h3>
          <p>Combined rubric index</p>
        </div>

        <div className="score-metric-card tech">
          <div className="metric-circle">
            <span className="score-number">{technical}</span>
            <span className="score-max">/100</span>
          </div>
          <h3>Technical Competence</h3>
          <p>Concepts, algorithms & logic</p>
        </div>

        <div className="score-metric-card comm">
          <div className="metric-circle">
            <span className="score-number">{communication}</span>
            <span className="score-max">/100</span>
          </div>
          <h3>Communication & Structure</h3>
          <p>Clarity, depth & professionalism</p>
        </div>
      </div>

      {/* AI Qualitative Feedback Grid */}
      <div className="feedback-cards-grid">
        {/* Strengths */}
        <div className="feedback-card strengths-card">
          <div className="feedback-card-header">
            <span className="card-badge green">Key Strengths</span>
            <h3>What You Did Exceptionally Well</h3>
          </div>
          <ul className="feedback-list">
            {(evaluation.strengths || []).map((item, idx) => (
              <li key={idx} className="strength-item">
                <span className="icon">✅</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="feedback-card weaknesses-card">
          <div className="feedback-card-header">
            <span className="card-badge amber">Areas for Polish</span>
            <h3>What to Refine Before Placements</h3>
          </div>
          <ul className="feedback-list">
            {(evaluation.weaknesses || []).map((item, idx) => (
              <li key={idx} className="weakness-item">
                <span className="icon">💡</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Placement Suggestions */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div className="suggestions-card">
          <div className="suggestions-header">
            <span className="card-badge blue">Action Plan</span>
            <h3>Actionable Placement Recommendations</h3>
          </div>
          <div className="suggestions-grid">
            {evaluation.suggestions.map((sug, idx) => (
              <div key={idx} className="suggestion-pill-item">
                <span className="sug-num">{idx + 1}</span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Summary Paragraph */}
      {evaluation.overall_feedback && (
        <div className="overall-summary-card">
          <h3>Interviewer Comprehensive Feedback</h3>
          <p className="summary-paragraph">{evaluation.overall_feedback}</p>
        </div>
      )}

      {/* Question by Question Review */}
      {questionReviews.length > 0 && (
        <div className="question-reviews-section">
          <div className="section-title-wrap">
            <h2>Detailed Question-by-Question Analysis</h2>
            <p>Review your exact answers alongside AI critique and suggested model answers.</p>
          </div>

          <div className="questions-breakdown-list">
            {questionReviews.map((qr, index) => (
              <div key={index} className="question-review-card">
                <div className="qr-header">
                  <span className="qr-num">Question {qr.question_number || index + 1}</span>
                  {qr.score && (
                    <span className="qr-score-badge">
                      Score: {qr.score}/10
                    </span>
                  )}
                </div>

                <div className="qr-question">
                  <strong>Question Asked:</strong>
                  <p>{qr.question}</p>
                </div>

                <div className="qr-answer">
                  <strong>Your Submitted Answer:</strong>
                  <div className="candidate-answer-quote">
                    {qr.candidate_answer || "(No response submitted)"}
                  </div>
                </div>

                {qr.feedback && (
                  <div className="qr-feedback">
                    <strong>AI Feedback & Critique:</strong>
                    <p>{qr.feedback}</p>
                  </div>
                )}

                {qr.ideal_answer && (
                  <div className="qr-ideal">
                    <strong>Recommended Ideal Answer:</strong>
                    <div className="ideal-answer-box">
                      {qr.ideal_answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <div className="report-footer-bar no-print">
        <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
          ← Return to Dashboard
        </button>
        <button className="btn-primary" onClick={() => navigate("/setup")}>
          Practice Another Interview →
        </button>
      </div>
    </div>
  );
}

export default Evaluation;

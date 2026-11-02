import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCandidateStats,
  getInterviewHistory,
  deleteInterviewRecord,
} from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user, openAuthModal, demoLogin } = useAuth();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.allSettled([
        getCandidateStats(),
        getInterviewHistory(),
      ]);

      let backendHistory = historyRes.status === "fulfilled" ? historyRes.value : [];
      let backendStats = statsRes.status === "fulfilled" ? statsRes.value : null;

      const localHistory = JSON.parse(localStorage.getItem("interviewHistory")) || [];

      const combinedHistory = [...backendHistory];
      for (const item of localHistory) {
        if (!combinedHistory.some((h) => (h.id && h.id === item.id) || (h.date === item.date && h.role === item.role))) {
          combinedHistory.push(item);
        }
      }

      setHistory(combinedHistory);

      if (backendStats && backendStats.total_interviews > 0) {
        setStats(backendStats);
      } else if (combinedHistory.length > 0) {
        const total = combinedHistory.length;
        const scores = combinedHistory.map((h) => h.overall_score || h.score || 75);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
        const best = Math.max(...scores);
        const totalQ = combinedHistory.reduce((sum, h) => sum + (h.total_questions || 5), 0);

        const allStrengths = [];
        const allWeaknesses = [];
        combinedHistory.forEach((h) => {
          if (Array.isArray(h.strengths)) allStrengths.push(...h.strengths);
          if (Array.isArray(h.weaknesses)) allWeaknesses.push(...h.weaknesses);
        });

        setStats({
          total_interviews: total,
          average_score: avg,
          best_score: best,
          total_questions: totalQ,
          technical_avg: avg,
          communication_avg: Math.min(avg + 4, 98),
          strengths_summary: [...new Set(allStrengths)].slice(0, 4),
          weaknesses_summary: [...new Set(allWeaknesses)].slice(0, 4),
          readiness_status:
            avg >= 85
              ? "Placement Ready - High Probability"
              : avg >= 70
              ? "Good Progress - Fine Tuning Recommended"
              : "Foundation Building - Further Practice Needed",
          readiness_color: avg >= 85 ? "success" : avg >= 70 ? "primary" : "warning",
        });
      } else {
        setStats({
          total_interviews: 0,
          average_score: 0,
          best_score: 0,
          total_questions: 0,
          technical_avg: 0,
          communication_avg: 0,
          strengths_summary: [],
          weaknesses_summary: [],
          readiness_status: "New Candidate",
          readiness_color: "neutral",
        });
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleDelete = async (id, index) => {
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;

    if (id) {
      try {
        await deleteInterviewRecord(id);
      } catch (e) {
        console.warn("Backend delete error:", e);
      }
    }

    const local = JSON.parse(localStorage.getItem("interviewHistory")) || [];
    const updatedLocal = local.filter((_, i) => i !== index);
    localStorage.setItem("interviewHistory", JSON.stringify(updatedLocal));

    loadDashboardData();
  };

  const handleViewReport = (item) => {
    navigate("/evaluation", {
      state: {
        evaluation: {
          overall_score: item.overall_score || item.score,
          technical_score: item.technical_score || item.technical || item.overall_score,
          communication_score: item.communication_score || item.communication || item.overall_score,
          strengths: item.strengths || ["Solid technical fundamentals", "Clear communication style"],
          weaknesses: item.weaknesses || ["Elaborate on edge cases", "Include Big-O complexity metrics"],
          suggestions: item.suggestions || ["Review system design fundamentals", "Practice STAR method for projects"],
          overall_feedback: item.overall_feedback || "Good mock interview performance.",
          question_reviews: item.question_reviews || [],
        },
        role: item.role,
        language: item.language,
        difficulty: item.difficulty,
        total_questions: item.total_questions,
      },
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <LoadingSpinner message="Loading your candidate profile and placement analytics..." />
      </div>
    );
  }

  const hasInterviews = history.length > 0;

  return (
    <div className="dashboard-page">
      {/* Candidate Profile Header */}
      <div className="dashboard-header-card">
        <div className="header-info">
          <div className="welcome-tag">
            <span>🎓 Candidate Placement Dashboard</span>
          </div>
          <h1>
            Welcome back, <span className="highlight-name">{user ? user.name : "Candidate"}</span>!
          </h1>
          <p className="header-subtitle">
            {hasInterviews
              ? "Track your progress, monitor technical strengths, and polish weak areas before your real campus placement drives."
              : "Get started with your first mock interview to benchmark your placement readiness!"}
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-start-primary" onClick={() => navigate("/setup")}>
            + Start New Mock Interview
          </button>
        </div>
      </div>

      {/* STATE 1: EMPTY STATE */}
      {!hasInterviews ? (
        <div className="empty-state-container">
          <div className="empty-card">
            <div className="empty-illustration">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2>No Mock Interviews Completed Yet</h2>
            <p>
              Your personalized performance dashboard will illuminate your strengths, weaknesses,
              and placement readiness scores once you complete your first practice interview.
            </p>

            <div className="how-it-works-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h4>Configure Role</h4>
                <p>Choose your target role (Frontend, Backend, ML, Fullstack) and tech stack.</p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h4>Upload Resume (Optional)</h4>
                <p>Our AI scans your PDF resume to generate questions based on your real projects.</p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h4>Practice & Get Evaluated</h4>
                <p>Type or speak your answers via microphone, and get instant scored rubrics.</p>
              </div>
            </div>

            <button className="btn-cta-launch" onClick={() => navigate("/setup")}>
              🚀 Launch Your First Mock Interview
            </button>
          </div>
        </div>
      ) : (
        /* STATE 2: RETURNING CANDIDATE */
        <div className="dashboard-content">
          {/* Key Metrics Grid */}
          <div className="stats-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Completed Interviews</span>
                <span className="metric-icon blue">📋</span>
              </div>
              <div className="metric-value">{stats?.total_interviews || history.length}</div>
              <div className="metric-footer">Mock interview sessions logged</div>
            </div>

            <div className="metric-card highlight">
              <div className="metric-header">
                <span className="metric-label">Average Score</span>
                <span className="metric-icon purple">🎯</span>
              </div>
              <div className="metric-value">{stats?.average_score || 0}<span className="unit">/100</span></div>
              <div className="metric-footer">
                <span className={`readiness-pill ${stats?.readiness_color}`}>
                  {stats?.readiness_status}
                </span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Highest Score</span>
                <span className="metric-icon green">🏆</span>
              </div>
              <div className="metric-value">{stats?.best_score || 0}<span className="unit">/100</span></div>
              <div className="metric-footer">Personal best performance</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Questions Solved</span>
                <span className="metric-icon amber">💡</span>
              </div>
              <div className="metric-value">{stats?.total_questions || 0}</div>
              <div className="metric-footer">Technical & HR questions answered</div>
            </div>
          </div>

          {/* AI Insights: Strengths & Weaknesses */}
          <div className="insights-grid">
            <div className="insight-card strengths">
              <div className="insight-card-header">
                <div className="insight-icon green">✓</div>
                <div>
                  <h3>Demonstrated Strengths</h3>
                  <p>Key technical competencies highlighted across your mock interviews</p>
                </div>
              </div>
              <div className="chips-container">
                {stats?.strengths_summary && stats.strengths_summary.length > 0 ? (
                  stats.strengths_summary.map((st, i) => (
                    <div key={i} className="chip success">
                      <span className="chip-bullet">✔</span> {st}
                    </div>
                  ))
                ) : (
                  <p className="no-data-text">Take more interviews to discover your top strengths.</p>
                )}
              </div>
            </div>

            <div className="insight-card weaknesses">
              <div className="insight-card-header">
                <div className="insight-icon amber">⚠</div>
                <div>
                  <h3>Areas for Placement Polish</h3>
                  <p>Recommended focus topics to practice before campus placement rounds</p>
                </div>
              </div>
              <div className="chips-container">
                {stats?.weaknesses_summary && stats.weaknesses_summary.length > 0 ? (
                  stats.weaknesses_summary.map((wk, i) => (
                    <div key={i} className="chip warning">
                      <span className="chip-bullet">💡</span> {wk}
                    </div>
                  ))
                ) : (
                  <p className="no-data-text">Great consistency! Keep practicing to maintain your edge.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Interviews Table */}
          <div className="recent-interviews-section" id="recent">
            <div className="section-title-row">
              <div>
                <h2>Interview History & Evaluation Records</h2>
                <p>Click "View Report" to see complete question-by-question critiques and model answers.</p>
              </div>
              <button className="btn-secondary-setup" onClick={() => navigate("/setup")}>
                + New Practice Session
              </button>
            </div>

            <div className="history-cards-grid">
              {history.map((item, index) => {
                const score = item.overall_score || item.score || 0;
                const scoreClass = score >= 85 ? "high" : score >= 70 ? "medium" : "low";

                return (
                  <div key={item.id || index} className="interview-history-card">
                    <div className="card-top-row">
                      <div className="role-and-tech">
                        <h3>{item.role || "Technical Candidate"}</h3>
                        <div className="badges-row">
                          <span className="tech-badge">{item.language || "Tech Stack"}</span>
                          <span className="diff-badge">{item.difficulty || "Medium"}</span>
                        </div>
                      </div>

                      <div className={`score-badge ${scoreClass}`}>
                        <span className="score-num">{score}</span>
                        <span className="score-den">/100</span>
                      </div>
                    </div>

                    <div className="card-meta-row">
                      <span>📅 {item.date || "Recent"}</span>
                      <span>❓ {item.total_questions || 5} Questions</span>
                      {item.technical_score && <span>⚙️ Tech: {item.technical_score}</span>}
                      {item.communication_score && <span>🗣️ Comm: {item.communication_score}</span>}
                    </div>

                    <div className="card-action-row">
                      <button
                        className="btn-view-report"
                        onClick={() => handleViewReport(item)}
                      >
                        View Full Report →
                      </button>
                      <button
                        className="btn-delete-record"
                        onClick={() => handleDelete(item.id, index)}
                        title="Delete Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

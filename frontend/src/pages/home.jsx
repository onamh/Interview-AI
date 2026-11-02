import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./home.css";

function Home() {
  const navigate = useNavigate();
  const { user, openAuthModal, demoLogin } = useAuth();

  const handleStart = () => {
    navigate("/setup");
  };

  const handleDemo = async () => {
    try {
      await demoLogin();
      navigate("/dashboard");
    } catch (e) {
      navigate("/setup");
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span>✨ Placement & Internship Ready</span>
        </div>

        <h1 className="hero-title">
          Ace Your Next Tech Interview with{" "}
          <span className="gradient-text">AI Coaching</span>
        </h1>

        <p className="hero-subtitle">
          Practice role-specific mock interviews tailored to your exact tech stack and resume.
          Answer via real-time voice or typing, hear the AI interviewer speak, and receive
          in-depth performance rubrics with strengths and weaknesses.
        </p>

        <div className="hero-cta-group">
          <button className="cta-primary" onClick={handleStart}>
            Start Mock Interview →
          </button>
          {user ? (
            <button className="cta-secondary" onClick={() => navigate("/dashboard")}>
              View Your Dashboard
            </button>
          ) : (
            <button className="cta-secondary" onClick={handleDemo}>
              ⚡ 1-Click Demo Account
            </button>
          )}
        </div>

        {/* Stats highlight pills */}
        <div className="hero-pills">
          <div className="pill-item">
            <span className="pill-icon">🎯</span>
            <span>Targeted Role Questions</span>
          </div>
          <div className="pill-item">
            <span className="pill-icon">📄</span>
            <span>PDF Resume Parsing</span>
          </div>
          <div className="pill-item">
            <span className="pill-icon">🎙️</span>
            <span>Voice Answering & TTS</span>
          </div>
          <div className="pill-item">
            <span className="pill-icon">📈</span>
            <span>Rubric Scoring (0-100)</span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Designed for College Placements</h2>
          <p className="section-desc">
            Everything you need to build confidence and excel in campus placement drives.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3>Resume-Tailored Questions</h3>
            <p>
              Upload your PDF resume. Our AI extracts your actual projects, tech stack, and internships to generate project-specific viva and architecture questions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <h3>Speech & Voice Interaction</h3>
            <p>
              Speak your answers naturally using the browser microphone, or listen to the AI interviewer read out questions with speech synthesis.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3>Comprehensive Evaluation</h3>
            <p>
              Receive overall, technical, and communication scores, detailed strengths, actionable areas for improvement, and model answers for every question.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <h3>Persistent Performance History</h3>
            <p>
              Database-backed candidate profiles track your progress over time, showing score trends and readiness levels on your personal dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch Banner */}
      <section className="cta-banner">
        <div className="banner-content">
          <h2>Ready to test your placement readiness?</h2>
          <p>Choose your tech stack, set your difficulty, and start in under 30 seconds.</p>
          <button className="cta-primary-large" onClick={handleStart}>
            Launch Interview Now →
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const storedHistory =
      JSON.parse(localStorage.getItem("interviewHistory")) || [];

    setHistory(storedHistory);
  }, []);

  // ==========================
  // Dashboard Statistics
  // ==========================

  const totalInterviews = history.length;

  const averageScore =
    totalInterviews > 0
      ? Math.round(
          history.reduce(
            (sum, item) => sum + (item.overall_score || item.score || 0),
            0
          ) / totalInterviews
        )
      : 0;

  const bestScore =
    totalInterviews > 0
      ? Math.max(
          ...history.map(
            (item) => item.overall_score || item.score || 0
          )
        )
      : 0;

  const totalQuestions = history.reduce(
    (sum, item) => sum + (item.total_questions || 0),
    0
  );

  return (
    <div className="dashboard">

      {/* ================= Navbar ================= */}

      <nav className="navbar">
        <h2>AI Interview Coach</h2>

        <button
          className="nav-btn"
          onClick={() => navigate("/setup")}
        >
          New Interview
        </button>
      </nav>

      {/* ================= Hero ================= */}

      <section className="hero">
        <h1>Practice AI Interviews</h1>

        <p>
          Improve your technical interview skills with
          personalized AI-powered mock interviews.
        </p>

        <button
          className="start-btn"
          onClick={() => navigate("/setup")}
        >
          Start Interview
        </button>
      </section>

      {/* ================= Statistics ================= */}

      <section className="stats">

        <div className="card">
          <h3>Interviews</h3>
          <p>{totalInterviews}</p>
        </div>

        <div className="card">
          <h3>Average Score</h3>
          <p>{averageScore}</p>
        </div>

        <div className="card">
          <h3>Best Score</h3>
          <p>{bestScore}</p>
        </div>

        <div className="card">
          <h3>Questions Solved</h3>
          <p>{totalQuestions}</p>
        </div>

      </section>

      {/* ================= Features ================= */}

      <section className="features">

        <h2>Features</h2>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>🤖 AI Interviews</h3>

            <p>
              Practice customized technical interviews
              generated specifically for your role and
              technology.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 AI Evaluation</h3>

            <p>
              Receive detailed AI-generated performance
              analysis after completing the interview.
            </p>
          </div>

          <div className="feature-card">
            <h3>📄 Resume Analyzer</h3>

            <p>
              Upload your resume and receive ATS analysis,
              missing skills, and improvement suggestions.
              <br />
              <strong>Coming Soon</strong>
            </p>
          </div>

        </div>

      </section>

      {/* ================= Recent Interviews ================= */}

      <section className="recent">

        <h2>Recent Interviews</h2>

        {history.length === 0 ? (

          <div className="empty">
            No interviews completed yet.
          </div>

        ) : (

          <div className="history-list">

            {[...history]
              .reverse()
              .map((item, index) => (

                <div
                  className="history-card"
                  key={index}
                >

                  <h3>{item.role}</h3>

                  <p>
                    <strong>Technology:</strong>{" "}
                    {item.language}
                  </p>

                  <p>
                    <strong>Difficulty:</strong>{" "}
                    {item.difficulty}
                  </p>

                  <p>
                    <strong>Questions:</strong>{" "}
                    {item.total_questions}
                  </p>

                  <p>
                    <strong>Score:</strong>{" "}
                    {item.overall_score || item.score}/100
                  </p>

                  <small>{item.date}</small>

                </div>

              ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;
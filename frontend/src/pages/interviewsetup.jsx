import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import jobRoles from "../data/jobroles";
import { startInterview, uploadResume } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import "./interviewsetup.css";

const POPULAR_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Android Developer",
  "Software Engineer (Campus Placement)"
];

const TECH_OPTIONS = [
  "Python", "React", "Java", "C++", "JavaScript", "TypeScript",
  "Node.js & Express", "Django", "FastAPI", "Spring Boot", ".NET",
  "MERN Stack", "SQL & Database Design", "Data Structures & Algorithms",
  "Machine Learning & PyTorch", "Docker & Kubernetes", "AWS Cloud"
];

function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("Full Stack Engineer");
  const [language, setLanguage] = useState("React");
  const [experience, setExperience] = useState("Beginner");
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("Technical");
  const [questions, setQuestions] = useState(5);
  const [followUp, setFollowUp] = useState(true);

  const [filteredRoles, setFilteredRoles] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Starting interview state
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const handleRoleInputChange = (e) => {
    const val = e.target.value;
    setRole(val);
    if (!val.trim()) {
      setFilteredRoles([]);
      setShowSuggestions(false);
      return;
    }

    const matched = (jobRoles || POPULAR_ROLES).filter((r) =>
      r.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredRoles(matched);
    setShowSuggestions(true);
  };

  const handleSelectRole = (selected) => {
    setRole(selected);
    setShowSuggestions(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please upload a PDF file.");
      return;
    }

    setUploadError("");
    setResumeFile(file);
    setUploadingResume(true);

    try {
      const data = await uploadResume(file);
      setResumeAnalysis(data);
    } catch (err) {
      console.error(err);
      setUploadError(
        err.response?.data?.detail || "Resume upload failed. You can still continue without a resume."
      );
    } finally {
      setUploadingResume(false);
    }
  };

  const handleClearResume = () => {
    setResumeFile(null);
    setResumeAnalysis(null);
    setUploadError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role.trim()) {
      alert("Please enter or select a target job role.");
      return;
    }

    setStartError("");
    setStarting(true);

    try {
      const response = await startInterview({
        role,
        language,
        experience,
        difficulty,
        interview_type: type,
        questions,
        follow_up: followUp,
        resume_analysis: resumeAnalysis,
      });

      navigate(`/interview/${response.session_id}`, {
        state: {
          ...response,
          role,
          language,
          difficulty,
          experience,
          type,
          resumeAnalysis,
        },
      });
    } catch (err) {
      console.error(err);
      setStartError(
        err.response?.data?.detail || "Unable to start mock interview session. Please verify backend connection."
      );
      setStarting(false);
    }
  };

  if (starting) {
    return (
      <div className="setup-container">
        <LoadingSpinner message="AI is preparing your personalized mock interview..." />
      </div>
    );
  }

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="badge-pill">⚙️ AI Mock Interview Setup</div>
        <h1>Configure Your Practice Session</h1>
        <p>
          Customize your role, tech stack, and difficulty. Upload your resume to test yourself
          on your actual academic and personal projects!
        </p>
      </div>

      {startError && <div className="setup-error-banner">{startError}</div>}

      <form className="setup-form" onSubmit={handleSubmit}>
        {/* Step 1: Target Role */}
        <div className="form-card">
          <div className="form-card-title">
            <span className="step-num">1</span>
            <div>
              <h3>Target Job Role</h3>
              <p>Type your desired role or choose a common placement profile</p>
            </div>
          </div>

          <div className="role-input-group">
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, Data Scientist..."
              value={role}
              onChange={handleRoleInputChange}
              onFocus={() => setShowSuggestions(filteredRoles.length > 0)}
              required
            />

            {showSuggestions && filteredRoles.length > 0 && (
              <div className="role-dropdown">
                {filteredRoles.slice(0, 8).map((job) => (
                  <div
                    key={job}
                    className="dropdown-item"
                    onClick={() => handleSelectRole(job)}
                  >
                    {job}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="quick-roles-pills">
            {POPULAR_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                className={`pill-btn ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Tech Stack & Difficulty */}
        <div className="form-card">
          <div className="form-card-title">
            <span className="step-num">2</span>
            <div>
              <h3>Technologies & Difficulty Parameters</h3>
              <p>Tailor the technical domain and interview difficulty</p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Primary Tech Stack / Subject</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {TECH_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="Beginner">Campus Fresher / Student (Beginner)</option>
                <option value="Intermediate">Entry-Level Junior (Intermediate)</option>
                <option value="Advanced">Experienced Associate (Advanced)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Interview Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy (Fundamentals & Definitions)</option>
                <option value="Medium">Medium (Application, Scenarios & Code Logic)</option>
                <option value="Hard">Hard (System Architecture, Concurrency & Edge Cases)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Interview Round Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Technical">Technical Round (Core Skills & Viva)</option>
                <option value="HR">HR / Behavioral Round (Situational & Soft Skills)</option>
                <option value="Mixed">Mixed Comprehensive (70% Tech + 30% HR)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Total Questions</label>
              <select
                value={questions}
                onChange={(e) => setQuestions(Number(e.target.value))}
              >
                <option value={3}>3 Questions (Quick Demo / Viva Mode)</option>
                <option value={5}>5 Questions (Standard Mock Interview)</option>
                <option value={10}>10 Questions (Deep Placement Drill)</option>
              </select>
            </div>

            <div className="form-field checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={followUp}
                  onChange={(e) => setFollowUp(e.target.checked)}
                />
                <span className="checkbox-text">
                  Enable adaptive follow-up style questions based on answer depth
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Step 3: Resume Upload (Optional) */}
        <div className="form-card">
          <div className="form-card-title">
            <span className="step-num">3</span>
            <div>
              <h3>Resume Intelligence (Optional)</h3>
              <p>Upload your PDF resume to generate interview questions focused on your real projects</p>
            </div>
          </div>

          {!resumeAnalysis ? (
            <div className="resume-dropzone">
              <input
                type="file"
                id="resume-file-input"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                style={{ display: "none" }}
              />
              <label htmlFor="resume-file-input" className="dropzone-label">
                <div className="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                {uploadingResume ? (
                  <span className="upload-status">Analyzing PDF Resume with AI...</span>
                ) : (
                  <>
                    <span className="upload-cta">Click to browse or drop your PDF Resume</span>
                    <span className="upload-hint">Supported format: .PDF (Max 5MB)</span>
                  </>
                )}
              </label>

              {uploadError && <div className="upload-error">{uploadError}</div>}
            </div>
          ) : (
            <div className="resume-success-card">
              <div className="success-header">
                <div className="success-badge">
                  <span>✓ Resume Analyzed Successfully</span>
                </div>
                <button
                  type="button"
                  className="btn-remove-resume"
                  onClick={handleClearResume}
                >
                  Change / Remove
                </button>
              </div>

              <div className="parsed-summary">
                <div className="summary-field">
                  <strong>Candidate:</strong> {resumeAnalysis.candidate_name || "Candidate"}
                </div>
                {resumeAnalysis.summary && (
                  <div className="summary-field">
                    <strong>Summary:</strong> {resumeAnalysis.summary}
                  </div>
                )}
                {resumeAnalysis.skills && resumeAnalysis.skills.length > 0 && (
                  <div className="parsed-skills">
                    <strong>Detected Skills:</strong>
                    <div className="skills-wrap">
                      {resumeAnalysis.skills.slice(0, 8).map((sk, idx) => (
                        <span key={idx} className="skill-pill">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resumeAnalysis.projects && resumeAnalysis.projects.length > 0 && (
                  <div className="parsed-projects">
                    <strong>Targeted Projects:</strong>
                    <ul>
                      {resumeAnalysis.projects.slice(0, 3).map((pj, idx) => (
                        <li key={idx}>{pj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="form-submit-row">
          <button
            type="submit"
            className="btn-launch-interview"
            disabled={uploadingResume}
          >
            🚀 Launch AI Mock Interview ({questions} Questions) →
          </button>
        </div>
      </form>
    </div>
  );
}

export default InterviewSetup;

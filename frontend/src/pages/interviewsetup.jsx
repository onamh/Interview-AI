import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewSetup.css";
import jobRoles from "../data/jobRoles";

import {
  startInterview,
  uploadResume,
} from "../api/interviewApi";

function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [language, setLanguage] = useState("Python");
  const [experience, setExperience] = useState("Beginner");
  const [difficulty, setDifficulty] = useState("Easy");
  const [type, setType] = useState("Technical");
  const [questions, setQuestions] = useState(5);
  const [followUp, setFollowUp] = useState(true);

  const [filteredRoles, setFilteredRoles] = useState([]);

  /* Resume */

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);

  // -----------------------------
  // Job Role Suggestions
  // -----------------------------

  const handleRoleChange = (e) => {
    const value = e.target.value;

    setRole(value);

    if (value.trim() === "") {
      setFilteredRoles([]);
      return;
    }

    const filtered = jobRoles.filter((job) =>
      job.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredRoles(filtered);
  };

  // -----------------------------
  // Resume Upload
  // -----------------------------

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setResumeFile(file);
    setUploading(true);

    try {
      const analysis = await uploadResume(file);

      setResumeAnalysis(analysis);

      alert("Resume analyzed successfully!");
    } catch (error) {
      console.error(error);

      alert("Resume upload failed.");
    }

    setUploading(false);
  };

  // -----------------------------
  // Start Interview
  // -----------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await startInterview({
        role,
        language,
        experience,
        difficulty,
        interview_type: type,
        questions,
        follow_up: followUp,

        // Optional Resume
        resume_analysis: resumeAnalysis,
      });

      navigate(`/interview/${response.session_id}`, {
        state: {
          ...response,
          role,
          language,
          resumeAnalysis,
        },
      });
    } catch (error) {
      console.error(error);

      alert("Unable to start interview.");
    }
  };

  return (
    <div className="setup-container">
      <form
        className="setup-form"
        onSubmit={handleSubmit}
      >
        <h1>Interview Setup</h1>

        {/* Job Role */}

        <label>Target Job Role</label>

        <input
          type="text"
          placeholder="e.g. Machine Learning Engineer"
          value={role}
          onChange={handleRoleChange}
          required
        />

        {filteredRoles.length > 0 && (
          <div className="suggestions">
            {filteredRoles.map((job) => (
              <div
                key={job}
                className="suggestion-item"
                onClick={() => {
                  setRole(job);
                  setFilteredRoles([]);
                }}
              >
                {job}
              </div>
            ))}
          </div>
        )}

        {/* Resume */}

        <label>Resume (Optional)</label>

        <input
          type="file"
          accept=".pdf"
          onChange={handleResumeUpload}
        />

        {uploading && (
          <p>Analyzing resume...</p>
        )}

        {resumeAnalysis && (
          <p
            style={{
              color: "green",
              fontWeight: "bold",
            }}
          >
            ✓ Resume analyzed successfully
          </p>
        )}

        {/* Experience */}

        <label>Experience Level</label>

        <select
          value={experience}
          onChange={(e) =>
            setExperience(e.target.value)
          }
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>

        {/* Difficulty */}

        <label>Interview Difficulty</label>

        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value)
          }
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        {/* Interview Type */}

        <label>Interview Type</label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>Technical</option>
          <option>HR</option>
          <option>Mixed</option>
        </select>

        {/* Technology */}

        <label>Programming Language / Tech Stack</label>

        <select
          value={language}
          onChange={(e) =>
            setLanguage(e.target.value)
          }
        >
          <option>Python</option>
          <option>Java</option>
          <option>C++</option>
          <option>C</option>
          <option>JavaScript</option>
          <option>TypeScript</option>
          <option>React</option>
          <option>Angular</option>
          <option>Vue</option>
          <option>Node.js</option>
          <option>Express.js</option>
          <option>Django</option>
          <option>Flask</option>
          <option>FastAPI</option>
          <option>Spring Boot</option>
          <option>.NET</option>
          <option>MERN</option>
          <option>MEAN</option>
          <option>SQL</option>
          <option>NoSQL</option>
          <option>MongoDB</option>
          <option>PostgreSQL</option>
          <option>AWS</option>
          <option>Azure</option>
          <option>Docker</option>
          <option>Kubernetes</option>
        </select>

        {/* Questions */}

        <label>Number of Questions</label>

        <select
          value={questions}
          onChange={(e) =>
            setQuestions(Number(e.target.value))
          }
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>

        {/* Follow Up */}

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={followUp}
            onChange={(e) =>
              setFollowUp(e.target.checked)
            }
          />

          Include follow-up questions based on
          your answers.
        </label>

        <button
          type="submit"
          disabled={uploading}
        >
          {uploading
            ? "Analyzing Resume..."
            : "Start Interview"}
        </button>
      </form>
    </div>
  );
}

export default InterviewSetup;
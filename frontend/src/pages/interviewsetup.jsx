import { useState } from "react";
import "./InterviewSetup.css";

function InterviewSetup() {
  const [role, setRole] = useState("Python Developer");
  const [experience, setExperience] = useState("Beginner");
  const [type, setType] = useState("Technical");
  const [language, setLanguage] = useState("Python");
  const [questions, setQuestions] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      role,
      experience,
      type,
      language,
      questions,
    });
  };

  return (
    <div className="setup-container">
      <form className="setup-form" onSubmit={handleSubmit}>
        <h1>Interview Setup</h1>

        <label>Job Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Python Developer</option>
          <option>Frontend Developer</option>
          <option>Backend Developer</option>
          <option>Full Stack Developer</option>
          <option>Data Scientist</option>
          <option>Machine Learning Engineer</option>
        </select>

        <label>Experience Level</label>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Experienced</option>
        </select>

        <label>Interview Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Technical</option>
          <option>HR</option>
          <option>Mixed</option>
        </select>

        <label>Programming Language</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>Python</option>
          <option>JavaScript</option>
          <option>Java</option>
          <option>C++</option>
          <option>Go</option>
          <option>Rust</option>
          <option>C#</option>
        </select>

        <label>Number of Questions</label>
        <select
          value={questions}
          onChange={(e) => setQuestions(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>

        <button type="submit">Start Interview</button>
      </form>
    </div>
  );
}

export default InterviewSetup;
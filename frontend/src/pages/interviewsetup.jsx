import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview, uploadResume } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  Briefcase,
  Code2,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sliders,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

function InterviewSetup() {
  const navigate = useNavigate();

  // Form states
  const [role, setRole] = useState("Full Stack Developer");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("Fresher (0-1 yrs)");
  const [experienceYears, setExperienceYears] = useState("0");
  const [interviewType, setInterviewType] = useState("Technical");
  const [customTypeDesc, setCustomTypeDesc] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionsCount, setQuestionsCount] = useState(5);
  const [followUp, setFollowUp] = useState(true);
  const [jobDescription, setJobDescription] = useState("");

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const roleSuggestions = [
    "Frontend Developer",
    "Python Developer",
    "Full Stack Developer",
    "AI/ML Engineer",
    "Data Scientist",
    "Software Engineer",
  ];

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleResumeDrop = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Please upload a PDF document (.pdf)");
      return;
    }

    setResumeFile(file);
    setResumeError("");
    setUploadingResume(true);

    try {
      const data = await uploadResume(file);
      setResumeAnalysis(data);

      if (data.skills && data.skills.length > 0) {
        const newSkills = Array.from(new Set([...skills, ...data.skills.slice(0, 6)]));
        setSkills(newSkills);
      }
    } catch (err) {
      console.error(err);
      setResumeError("Failed to parse resume text. You can still proceed without a resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeAnalysis(null);
    setResumeError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role.trim()) {
      setErrorMessage("Please specify your target role.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    const payload = {
      role: role.trim(),
      language: skills.join(", ") || "Core Technical Fundamentals",
      experience: experience === "Experienced" ? `${experienceYears} years` : experience,
      difficulty,
      interview_type: interviewType === "Custom" ? `Custom: ${customTypeDesc}` : interviewType,
      questions: Number(questionsCount) || 5,
      follow_up: followUp,
      job_description: jobDescription.trim() || undefined,
      resume_analysis: resumeAnalysis || undefined,
    };

    try {
      const response = await startInterview(payload);
      navigate(`/interview/${response.session_id}`, {
        state: {
          session_id: response.session_id,
          question: response.question,
          current_question: 1,
          total_questions: Number(questionsCount) || 5,
          role: payload.role,
          language: payload.language,
          difficulty: payload.difficulty,
          interview_type: payload.interview_type,
        },
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.detail || err.response?.data?.error || "Error initiating interview session."
      );
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <LoadingSpinner message="Interview AI is formulating your personalized interview session..." />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
            Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-xs text-[#57534e]">
            Choose your target role, core technologies, and optional resume for tailored viva questions.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Role & Career Goal */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <Briefcase className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                1. Target Role
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403c] mb-1">
                Target Job Position
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer, Python Engineer, Full Stack Developer..."
                className="w-full px-3.5 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
                required
              />
            </div>

            {/* Role Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#78716c]">Suggestions:</span>
              {roleSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setRole(sug)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    role === sug
                      ? "bg-[#171717] text-white"
                      : "bg-[#f7f5f0] text-[#44403c] hover:bg-[#ede8df] border border-[#e8e4dc]"
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Skills & Tech Stack Multi-Tag */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <Code2 className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                2. Technologies & Topics
              </h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and click Add (e.g. React, SQL, Python, DSA)..."
                className="flex-1 px-3.5 py-2 text-sm bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Selected Skills Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f7f5f0] text-[#171717] border border-[#e8e4dc]"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Experience, Difficulty, and Format */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <Sliders className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                3. Interview Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Experience Level */}
              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
                >
                  <option value="Student">Student (Pre-Final Year)</option>
                  <option value="Fresher (0-1 yrs)">Fresher / Graduate</option>
                  <option value="Internship">Internship Candidate</option>
                  <option value="Entry-Level (1-3 yrs)">Entry-Level (1-3 yrs)</option>
                </select>
              </div>

              {/* Interview Type */}
              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Interview Round
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
                >
                  <option value="Technical">Technical Viva (Concepts & Logic)</option>
                  <option value="HR">HR & Behavioral</option>
                  <option value="Mixed">Mixed (Technical + HR)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
                >
                  <option value="Easy">Standard / Foundational</option>
                  <option value="Medium">Medium / Placement Drive</option>
                  <option value="Hard">Challenging / Advanced</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-[#44403c] mb-1">
                  Total Questions
                </label>
                <select
                  value={questionsCount}
                  onChange={(e) => setQuestionsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
                >
                  <option value={3}>Quick (3 questions)</option>
                  <option value={5}>Standard (5 questions)</option>
                  <option value={8}>Comprehensive (8 questions)</option>
                </select>
              </div>
            </div>

            {/* Follow-up Questions Toggle */}
            <div className="pt-2 flex items-center justify-between border-t border-[#f0ece3]">
              <div>
                <h4 className="text-xs font-bold text-[#171717]">
                  Include follow up questions based on your answers
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setFollowUp(!followUp)}
                className="cursor-pointer text-[#171717]"
              >
                {followUp ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-[#d4cec2]" />}
              </button>
            </div>
          </div>

          {/* Section 4: Resume Upload */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <FileText className="w-4 h-4 text-[#171717]" />
              <h2 className="text-sm font-bold text-[#171717]">
                4. Resume Upload (Optional)
              </h2>
            </div>

            {!resumeFile ? (
              <label className="border-2 border-dashed border-[#d4cec2] hover:border-[#171717] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#f7f5f0]">
                <UploadCloud className="w-8 h-8 text-[#a8a29e] mb-1.5" />
                <span className="text-xs font-bold text-[#171717]">
                  Upload PDF Resume
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeDrop}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ede8df] text-[#171717] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#171717]">
                      {resumeFile.name}
                    </h4>
                    <span className="text-[11px] text-[#78716c]">
                      {uploadingResume ? "Analyzing resume..." : "Parsed & Active"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveResume}
                  className="p-1.5 text-[#a8a29e] hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {resumeError && <p className="text-xs text-rose-600">{resumeError}</p>}
          </div>

          {/* Final Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#78716c]">
              Configured: {questionsCount} questions • {difficulty} • {experience}
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all shadow-xs cursor-pointer"
            >
              <span>Start Interview Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InterviewSetup;

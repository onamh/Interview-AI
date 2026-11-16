import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listUserResumes, uploadResume, deleteResumeRecord } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  ArrowRight,
} from "lucide-react";

function Resumes() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await listUserResumes();
      setResumes(data.resumes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      await uploadResume(file);
      await fetchResumes();
    } catch (err) {
      console.error(err);
      setError("Failed to upload and analyze resume PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await deleteResumeRecord(id);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
              Document Vault
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
              My Uploaded Resumes
            </h1>
            <p className="text-xs text-[#57534e]">
              Manage resumes used to formulate personalized technical viva and project questions.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs self-start sm:self-auto">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? "Analyzing..." : "Upload PDF Resume"}</span>
            <input
              type="file"
              accept=".pdf"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs text-rose-700 bg-rose-50 border border-rose-200">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading your resume documents..." />
        ) : resumes.length === 0 ? (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] text-[#78716c] flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">
              No Resumes Uploaded Yet
            </h3>
            <p className="text-xs text-[#57534e] max-w-sm mx-auto">
              Upload your PDF resume to extract skills and projects automatically for targeted interview questions.
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              <span>Select PDF Resume</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#171717] truncate max-w-[200px]">
                          {res.filename}
                        </h3>
                        <span className="text-[11px] text-[#78716c]">
                          {res.created_at ? new Date(res.created_at).toLocaleDateString() : "Uploaded"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(res.id)}
                      className="p-1.5 text-[#a8a29e] hover:text-rose-600 transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Candidate Name */}
                  {res.candidate_name && (
                    <p className="text-xs font-semibold text-[#171717]">
                      Candidate: {res.candidate_name}
                    </p>
                  )}

                  {/* Skills tags */}
                  {res.skills && res.skills.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                        Detected Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {res.skills.slice(0, 7).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects preview */}
                  {res.projects && res.projects.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                        Key Projects
                      </span>
                      <ul className="text-xs text-[#57534e] space-y-1">
                        {res.projects.slice(0, 2).map((proj, idx) => (
                          <li key={idx} className="truncate">
                            • {proj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#f0ece3] flex justify-between items-center">
                  <span className="text-[11px] text-[#171717] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Parsed & Ready
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate("/setup")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#171717] hover:underline"
                  >
                    <span>Practice with Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Resumes;

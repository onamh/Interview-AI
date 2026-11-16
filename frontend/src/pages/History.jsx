import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFilteredHistory, deleteInterviewRecord } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  Clock,
  Trash2,
  Eye,
  Search,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";

function History() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getFilteredHistory({
        role: roleFilter || undefined,
        sort: sortOrder,
      });
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error(err);
      const local = JSON.parse(localStorage.getItem("interviewHistory")) || [];
      setInterviews(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteInterviewRecord(itemToDelete.id);
      setInterviews(interviews.filter((i) => i.id !== itemToDelete.id));

      const local = JSON.parse(localStorage.getItem("interviewHistory")) || [];
      const updated = local.filter((i) => i.id !== itemToDelete.id);
      localStorage.setItem("interviewHistory", JSON.stringify(updated));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
              Session Archive
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
              Interview History & Reports
            </h1>
            <p className="text-xs text-[#57534e]">
              Review your previous assessments, track score improvements, and revisit model benchmark answers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/setup")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Practice Session</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#a8a29e] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by role (e.g. Frontend, Python, Full Stack)..."
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden focus:border-[#171717]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] rounded-xl cursor-pointer"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="w-4 h-4 text-[#78716c]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[#171717] focus:outline-hidden"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="score_desc">Highest Score</option>
              <option value="score_asc">Lowest Score</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <LoadingSpinner message="Loading your interview archive..." />
        ) : interviews.length === 0 ? (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] text-[#78716c] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#171717]">
              No Practice Sessions Recorded Yet
            </h3>
            <p className="text-xs text-[#57534e] max-w-sm mx-auto">
              You haven't completed any mock interviews matching these criteria yet.
            </p>
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] cursor-pointer"
            >
              Start Practice Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#171717]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#171717] text-white">
                      Score: {item.overall_score ?? "--"}/100
                    </span>
                    <span className="text-xs font-medium text-[#57534e]">
                      {item.language || "Technical"}
                    </span>
                    <span className="text-[#d4cec2]">•</span>
                    <span className="text-xs font-medium text-[#78716c]">
                      Level: {item.difficulty || "Medium"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171717]">
                    {item.role || "Technical Role"}
                  </h3>
                  <p className="text-[11px] text-[#78716c]">
                    Completed on {item.date || "Past Session"} • {item.total_questions || 5} questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/evaluation", {
                        state: {
                          evaluation: {
                            overall_score: item.overall_score,
                            technical_score: item.technical_score,
                            communication_score: item.communication_score,
                            clarity_score: item.clarity_score,
                            structure_score: item.structure_score,
                            confidence_score: item.confidence_score,
                            strengths: item.strengths,
                            weaknesses: item.weaknesses,
                            suggestions: item.suggestions,
                            overall_feedback: item.overall_feedback,
                            question_reviews: item.question_reviews,
                          },
                          role: item.role,
                          language: item.language,
                          difficulty: item.difficulty,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-[#f7f5f0] hover:bg-[#ede8df] border border-[#e8e4dc] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-[#a8a29e] hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
              <h3 className="text-base font-bold text-[#171717]">
                Delete Interview Record?
              </h3>
              <p className="text-xs text-[#57534e]">
                This will remove the session data from your archive permanently.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2 text-xs font-semibold text-[#57534e] bg-[#f7f5f0] hover:bg-[#ede8df] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;

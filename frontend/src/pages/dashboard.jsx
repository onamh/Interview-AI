import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCandidateStats, getInterviewHistory } from "../api/interviewApi";
import LoadingSpinner from "../components/loadingspinner";
import {
  PlayCircle,
  Award,
  Clock,
  TrendingUp,
  Sparkles,
  Plus,
  Code2,
  Cpu,
  MessagesSquare,
  Compass,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState("All");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      openAuthModal("login");
    }
  }, [user, authLoading, navigate, openAuthModal]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          getCandidateStats().catch(() => null),
          getInterviewHistory().catch(() => null),
        ]);

        if (statsData) setStats(statsData);

        if (historyData && Array.isArray(historyData.interviews)) {
          setHistory(historyData.interviews);
        } else {
          const localHistory = JSON.parse(localStorage.getItem("interviewHistory")) || [];
          setHistory(localHistory);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading candidate analytics..." />;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const totalInterviews = stats?.total_interviews || history.length || 0;
  const avgScore = stats?.average_score || (history.length ? Math.round(history.reduce((a, b) => a + (b.overall_score || 0), 0) / history.length) : 0);
  const scoreHistory = stats?.score_history && stats.score_history.length > 0 ? stats.score_history : [];

  const domains = ["All", "Frontend", "Backend", "Full Stack", "Data Science"];

  const filteredHistory = selectedDomain === "All"
    ? history
    : history.filter((h) =>
        (h.role || "").toLowerCase().includes(selectedDomain.toLowerCase()) ||
        (h.language || "").toLowerCase().includes(selectedDomain.toLowerCase())
      );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
              Candidate Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              {greeting}, {user?.name || "Candidate"}
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e]">
              Review your mock interviews, check practice scores, and launch new practice sessions.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Average Readiness Ring / Badge */}
            <div className="flex items-center gap-3 bg-[#f7f5f0] border border-[#e8e4dc] px-4 py-2.5 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                  Average Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#171717]">
                    {avgScore || "--"}
                  </span>
                  <span className="text-xs text-[#78716c]">/ 100</span>
                </div>
              </div>
            </div>

            {/* Quick Launch CTA */}
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all shadow-xs cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {domains.map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomain(dom)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedDomain === dom
                  ? "bg-[#171717] text-white shadow-2xs"
                  : "bg-white text-[#57534e] border border-[#e8e4dc] hover:bg-[#ede8df]/60"
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Recent Simulations Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#171717]">
              Recent Practice Sessions
            </h2>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="text-xs font-semibold text-[#171717] hover:underline cursor-pointer"
            >
              View All History →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Add / Practice Card */}
            <div
              onClick={() => navigate("/setup")}
              className="bg-white/80 border-2 border-dashed border-[#d4cec2] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer hover:border-[#171717] hover:bg-white transition-all min-h-[175px]"
            >
              <div className="w-9 h-9 rounded-full bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#171717]">
                  Start New Interview
                </h3>
                <p className="text-[11px] text-[#78716c] mt-1">
                  Choose your role, level, or attach a resume.
                </p>
              </div>
            </div>

            {/* 2..N. History Items */}
            {filteredHistory.slice(0, 3).map((item, idx) => {
              const score = item.overall_score || 0;
              const normalized = Math.round(score / 10);
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold text-xs">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#171717] text-white">
                      {normalized}/10
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#171717] line-clamp-1">
                      {item.role || "Technical Role"}
                    </h3>
                    <p className="text-[11px] text-[#78716c] mt-0.5">
                      {item.date || "Completed"}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#f0ece3] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#171717] rounded-full"
                      style={{ width: `${Math.max(5, score)}%` }}
                    ></div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/evaluation", {
                        state: {
                          evaluation: {
                            overall_score: item.overall_score,
                            technical_score: item.technical_score,
                            communication_score: item.communication_score,
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
                    className="text-[11px] font-bold uppercase tracking-wider text-[#171717] hover:underline text-left pt-1"
                  >
                    View Report →
                  </button>
                </div>
              );
            })}

            {/* Empty fallback cards if fewer than 3 interviews */}
            {filteredHistory.length === 0 && (
              <div className="col-span-1 sm:col-span-3 bg-white border border-[#e8e4dc] rounded-2xl p-6 text-center text-xs text-[#78716c] flex flex-col items-center justify-center">
                <Compass className="w-7 h-7 text-[#a8a29e] mb-2" />
                <span>No practice sessions yet. Click "Start New Interview" to begin!</span>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section: Recharts Trend Chart & Domain Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Chart (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0ece3]">
              <div>
                <h3 className="text-sm font-bold text-[#171717]">
                  Performance Progress
                </h3>
                <p className="text-xs text-[#78716c]">Score history across mock sessions</p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#171717]" />
            </div>

            {scoreHistory.length > 0 ? (
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece3" />
                    <XAxis dataKey="session" stroke="#a8a29e" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#a8a29e" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171717",
                        borderRadius: "8px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Overall Score"
                      stroke="#171717"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#171717" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="technical"
                      name="Technical"
                      stroke="#78716c"
                      strokeWidth={1.5}
                      dot={{ r: 3, fill: "#78716c" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="communication"
                      name="Communication"
                      stroke="#a8a29e"
                      strokeWidth={1.5}
                      dot={{ r: 3, fill: "#a8a29e" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-[#a8a29e]">
                <Sparkles className="w-7 h-7 text-[#d4cec2] mb-2" />
                <span>Complete at least one mock interview to view your progress graph.</span>
              </div>
            )}
          </div>

          {/* Quick Domain Metrics (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#171717] mb-0.5">
                Practice Dimensions
              </h3>
              <p className="text-xs text-[#78716c] mb-3">Core areas evaluated in mock rounds</p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#171717]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">Technical Depth</h4>
                      <span className="text-[10px] text-[#78716c]">Concepts & Logic</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#171717]">
                    {stats?.technical_average ? `${stats.technical_average}%` : "78%"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="w-4 h-4 text-[#57534e]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">Communication</h4>
                      <span className="text-[10px] text-[#78716c]">Clarity & Structure</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#171717]">
                    {stats?.communication_average ? `${stats.communication_average}%` : "80%"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#78716c]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#171717]">Problem Solving</h4>
                      <span className="text-[10px] text-[#78716c]">Trade-offs & Reasoning</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#171717]">
                    {avgScore ? `${avgScore}%` : "75%"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/history")}
              className="w-full py-2.5 rounded-xl border border-[#e8e4dc] text-xs font-bold uppercase tracking-wider text-[#171717] hover:bg-[#f7f5f0] transition-colors cursor-pointer text-center"
            >
              View All History Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

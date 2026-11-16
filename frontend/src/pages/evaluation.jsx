import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Printer,
  RotateCcw,
  ArrowLeft,
  FileText,
  Target,
  Sparkles,
  User,
} from "lucide-react";

function Evaluation() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const evaluation = state?.evaluation;
  const role = state?.role || "Software Engineer";
  const language = state?.language || "Technical";
  const difficulty = state?.difficulty || "Medium";

  if (!evaluation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#171717] mb-2">
            No Evaluation Session Found
          </h2>
          <p className="text-xs text-[#57534e] mb-6">
            Please complete or start a mock interview session to view your performance report.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
          >
            Go to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overall = typeof evaluation.overall_score === "number" ? evaluation.overall_score : 0;
  const technical = typeof evaluation.technical_score === "number" ? evaluation.technical_score : overall;
  const communication = typeof evaluation.communication_score === "number" ? evaluation.communication_score : overall;
  const clarity = typeof evaluation.clarity_score === "number" ? evaluation.clarity_score : communication;
  const structure = typeof evaluation.structure_score === "number" ? evaluation.structure_score : technical;
  const confidence = typeof evaluation.confidence_score === "number" ? evaluation.confidence_score : overall;

  const questionReviews = evaluation.question_reviews || [];

  const handlePrint = () => {
    window.print();
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, overall)) / 100) * circumference;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#57534e] hover:text-[#171717] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Candidate Dashboard</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-white border border-[#e8e4dc] hover:bg-[#faf9f6] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#78716c]" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          </div>
        </div>

        {/* Primary Report Card */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f0ece3]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">
                  Interview Evaluation Report
                </h1>
                <p className="text-xs text-[#78716c]">
                  Role: {role} • Difficulty: {difficulty}
                </p>
              </div>
            </div>

            <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full border ${
              overall >= 60
                ? "bg-[#f7f5f0] text-[#171717] border-[#e8e4dc]"
                : overall >= 40
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {overall >= 60 ? "Completed Evaluation" : overall >= 40 ? "Needs Practice" : overall > 0 ? "Incomplete / Low Score" : "Zero Marks (No Substantive Answers)"}
            </span>
          </div>

          {/* Main 2-Col Gauge & Dimension Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
            {/* Left: Overall Score Circular Ring */}
            <div className="md:col-span-5 bg-[#f7f5f0] border border-[#e8e4dc] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78716c] mb-3">
                Overall Score
              </span>

              {/* Circular SVG Ring Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-[#e8e4dc]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className={`${overall >= 60 ? "stroke-[#171717]" : overall >= 40 ? "stroke-amber-600" : "stroke-rose-600"} transition-all duration-1000 ease-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-4xl font-extrabold ${overall >= 40 ? "text-[#171717]" : "text-rose-600"}`}>
                    {overall}
                  </span>
                  <span className="text-[11px] font-semibold text-[#a8a29e] -mt-1">
                    out of 100
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-[#78716c] mt-3 font-medium">
                {overall >= 60 ? "Solid overall attempt" : overall >= 40 ? "Fair attempt with areas to expand" : overall > 0 ? "Minimal answers detected" : "Zero marks awarded: No substantive answers were provided."}
              </span>
            </div>

            {/* Right: Dimension Breakdown Bars */}
            <div className="md:col-span-7 space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Performance Dimensions
              </span>

              {/* Clarity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#57534e]">Clarity & Structure</span>
                  <span className="text-[#171717] font-bold">{clarity}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#171717] rounded-full"
                    style={{ width: `${Math.max(5, clarity)}%` }}
                  ></div>
                </div>
              </div>

              {/* Structure */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#57534e]">Response Depth</span>
                  <span className="text-[#171717] font-bold">{structure}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#57534e] rounded-full"
                    style={{ width: `${Math.max(5, structure)}%` }}
                  ></div>
                </div>
              </div>

              {/* Technical Depth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#57534e]">Technical Accuracy</span>
                  <span className="text-[#171717] font-bold">{technical}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#171717] rounded-full"
                    style={{ width: `${Math.max(5, technical)}%` }}
                  ></div>
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#57534e]">Problem-Solving</span>
                  <span className="text-[#171717] font-bold">{confidence}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ece3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#78716c] rounded-full"
                    style={{ width: `${Math.max(5, confidence)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Evaluator Feedback */}
          {evaluation.overall_feedback && (
            <div className="bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                Interviewer Assessment
              </span>
              <p className="text-xs sm:text-sm text-[#44403c] leading-relaxed">
                {evaluation.overall_feedback}
              </p>
            </div>
          )}
        </div>

        {/* Strengths & Polish Areas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <div className="w-7 h-7 rounded-lg bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Key Strengths
              </h3>
            </div>
            <ul className="space-y-2">
              {(evaluation.strengths || []).map((st, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#44403c]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f0ece3]">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Areas for Improvement
              </h3>
            </div>
            <ul className="space-y-2">
              {(evaluation.weaknesses || []).map((wk, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#44403c]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Question-by-Question Review */}
        {questionReviews.length > 0 && (
          <div className="space-y-4 pt-2">
            <div>
              <h2 className="text-base font-bold text-[#171717]">
                Detailed Question Review
              </h2>
              <p className="text-xs text-[#78716c]">
                Your answers alongside AI evaluation and model benchmark solutions.
              </p>
            </div>

            <div className="space-y-4">
              {questionReviews.map((qr, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#e8e4dc] rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0ece3]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                      Question {qr.question_number || index + 1} of {questionReviews.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#171717] text-white">
                      Score: {qr.score ?? 1} / 10
                    </span>
                  </div>

                  {/* Question */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a8a29e] mb-1">
                      Question Asked
                    </h4>
                    <p className="text-sm font-semibold text-[#171717]">
                      {qr.question}
                    </p>
                  </div>

                  {/* Candidate Answer */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a8a29e] mb-1 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#171717]" />
                      Candidate's Response
                    </h4>
                    <div className="bg-[#f7f5f0] border-l-2 border-[#171717] rounded-r-lg p-3 text-xs text-[#171717] leading-relaxed font-mono">
                      {qr.candidate_answer || "(No written answer provided)"}
                    </div>
                  </div>

                  {/* Evaluator Critique */}
                  {qr.feedback && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a8a29e] mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#171717]" />
                        Evaluator Critique
                      </h4>
                      <p className={`text-xs leading-relaxed ${(qr.score || 0) <= 2 ? "text-rose-700 font-medium" : "text-[#44403c]"}`}>
                        {qr.feedback}
                      </p>
                    </div>
                  )}

                  {/* Ideal Model Answer */}
                  {qr.ideal_answer && (
                    <div className="bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-3.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#171717]" />
                        Recommended Benchmark Answer
                      </h4>
                      <p className="text-xs text-[#44403c] leading-relaxed">
                        {qr.ideal_answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Evaluation;

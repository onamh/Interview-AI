import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight } from "lucide-react";

function Home() {
  const { user } = useAuth();

  const steps = [
    {
      num: "01",
      title: "Choose Role & Experience",
      desc: "Select your target field (e.g. Frontend, Python, Full Stack) and optionally attach your resume to tailor questions to your background.",
    },
    {
      num: "02",
      title: "Complete the Mock Interview",
      desc: "Answer structured technical and behavioral questions at your own pace with clean, distraction-free typing.",
    },
    {
      num: "03",
      title: "Get Rubric Evaluation",
      desc: "Receive clear scores across technical depth, clarity, and structure, accompanied by ideal benchmark model answers.",
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Welcome Section */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#171717] leading-[1.12] max-w-3xl mx-auto">
          Feel more confident about your next interview with personalized AI practice
        </h1>

        <p className="text-base sm:text-lg text-[#57534e] max-w-2xl mx-auto leading-relaxed">
          Welcome to Interview AI! Gain experience by practicing mock interviews based on your targeted job and resume, analyze feedback, and track your performance.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] transition-all shadow-xs cursor-pointer"
          >
            <span>Start Practice Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#171717] bg-white border border-[#e8e4dc] hover:bg-[#faf9f6] transition-colors shadow-2xs"
            >
              <span>View Dashboard</span>
            </Link>
          )}
        </div>
      </section>

      {/* Simple 3-Step Process */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Simple, structured interview preparation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((st, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-2xs space-y-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#f7f5f0] border border-[#e8e4dc] text-[#171717] flex items-center justify-center font-bold text-xs">
                {st.num}
              </div>
              <h3 className="text-base font-bold text-[#171717]">{st.title}</h3>
              <p className="text-xs text-[#57534e] leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

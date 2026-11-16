import React from "react";
import { Loader2 } from "lucide-react";

function LoadingSpinner({ message = "AI is thinking..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 shadow-2xs">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{message}</h3>
      <p className="text-xs text-slate-500 max-w-sm">
        Preparing your customized placement questions and evaluation metrics.
      </p>
    </div>
  );
}

export default LoadingSpinner;

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Loader2 } from "lucide-react";

interface IntelligenceInputProps {
  onAnalyze: (text: string) => Promise<void>;
  isAnalyzing: boolean;
}

export function IntelligenceInput({ onAnalyze, isAnalyzing }: IntelligenceInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
    await onAnalyze(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Vibe Coding: Intelligence Input</label>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste news headline or signal here... (e.g., 'Heavy storms in Suez Canal')"
          className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4 resize-none shadow-inner"
        />
        <button
          type="submit"
          disabled={!input.trim() || isAnalyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gemini Analyzing...
            </>
          ) : (
            <>
              Analyze Global Signal
            </>
          )}
        </button>
      </form>
    </div>
  );
}

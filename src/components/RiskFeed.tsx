import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, MapPin, Calendar, ExternalLink } from "lucide-react";
import { RiskEvent } from "../types";

export function RiskFeed({ risks }: { risks: RiskEvent[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 shrink-0">Active Threat Vectors</h3>
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {risks.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-[10px] text-slate-400 font-mono italic">No active vectors detected</span>
            </div>
          ) : (
            risks.map((risk) => (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center gap-3 p-2 rounded border transition-colors shadow-sm ${
                  risk.severity === 'High' ? 'bg-rose-50 border-rose-100' : 
                  risk.severity === 'Medium' ? 'bg-amber-50 border-amber-100' : 
                  'bg-blue-50 border-blue-100'
                }`}
              >
                <div className={`w-1 h-8 rounded shrink-0 ${
                  risk.severity === 'High' ? 'bg-rose-500' : 
                  risk.severity === 'Medium' ? 'bg-amber-500' : 
                  'bg-blue-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${
                    risk.severity === 'High' ? 'text-rose-700' : 
                    risk.severity === 'Medium' ? 'text-amber-700' : 
                    'text-blue-700'
                  }`}>
                    {risk.location}: {risk.severity} Risk
                  </p>
                  <p className="text-[10px] text-slate-500 truncate tracking-tight">
                    Impact: {risk.impactRadius}km | {risk.timestamp}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

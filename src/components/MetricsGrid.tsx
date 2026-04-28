import React from "react";
import { motion } from "motion/react";
import { AlertCircle, Clock, Fuel, ShieldCheck } from "lucide-react";
import { DashboardMetrics } from "../types";

export function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      <MetricCard
        label="Active Risks"
        value={metrics.activeRisks.toString().padStart(2, '0')}
        valueColor="text-rose-500"
      />
      <MetricCard
        label="Avg. Delay"
        value={`+${metrics.averageDelay.toFixed(1)}h`}
        valueColor="text-amber-500"
      />
      <MetricCard
        label="Efficiency"
        value={`${metrics.fuelEfficiency.toFixed(0)}%`}
        valueColor="text-emerald-500"
      />
      <MetricCard
        label="Reroutes"
        value={(metrics.activeRisks * 4).toString()} // Simulated reroute stat
        valueColor="text-blue-400"
      />
    </div>
  );
}

function MetricCard({ label, value, valueColor }: { 
  label: string; 
  value: string; 
  valueColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
    >
      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">{label}</p>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
    </motion.div>
  );
}

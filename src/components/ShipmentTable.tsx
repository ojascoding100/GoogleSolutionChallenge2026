import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Navigation, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Box, MapPin } from "lucide-react";
import { Shipment, ShipmentStatus } from "../types";

interface ShipmentTableProps {
  shipments: Shipment[];
  onReroute: (id: string) => void;
  isRerouting: string | null;
  onRecalculateAll?: () => void;
  isOptimizingAll?: boolean;
  title?: string;
  isRiskTable?: boolean;
}

export function ShipmentTable({ 
  shipments, 
  onReroute, 
  isRerouting, 
  onRecalculateAll,
  isOptimizingAll,
  title = "Shipment Optimization Queue", 
  isRiskTable = false 
}: ShipmentTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className={`text-sm font-bold uppercase tracking-widest ${isRiskTable ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
          {title}
        </h3>
        {!isRiskTable && onRecalculateAll && (
          <button 
            onClick={onRecalculateAll}
            disabled={isOptimizingAll}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded text-xs font-black uppercase tracking-wider hover:bg-indigo-100 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            {isOptimizingAll ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Optimizing All...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                <span>Recalculate All Routes</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-hidden border rounded-lg shadow-sm ${isRiskTable ? 'border-rose-200' : 'border-slate-200'}`}>
        <div className="h-full overflow-auto">
          <table className="w-full text-left">
            <thead className={`${isRiskTable ? 'bg-rose-50' : 'bg-slate-50'} text-slate-500 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10`}>
              <tr>
                <th className="p-3 font-semibold text-slate-400 w-10"></th>
                <th className="p-3 font-semibold text-slate-400">Vessel/Asset</th>
                <th className="p-3 font-semibold text-slate-400">Status</th>
                <th className="p-3 font-semibold text-center text-slate-400">Original ETA</th>
                <th className="p-3 font-semibold text-center text-slate-400">Optimized</th>
                <th className="p-3 font-semibold text-right text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-mono italic">
                    No active assets flagged in this sector.
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => {
                  const isDelayed = shipment.status === ShipmentStatus.DELAYED;
                  const isExpanded = expandedId === shipment.id;
                  
                  return (
                    <React.Fragment key={shipment.id}>
                      <tr 
                        className={`transition-colors cursor-pointer ${isDelayed ? 'bg-rose-50/50 hover:bg-rose-50' : 'bg-white hover:bg-slate-50'}`}
                        onClick={() => toggleExpand(shipment.id)}
                      >
                        <td className="p-3">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </td>
                        <td className="p-3">
                          <div className={`font-bold font-mono ${isDelayed ? 'text-rose-600' : 'text-slate-800'}`}>{shipment.id}</div>
                          <div className="text-[10px] text-slate-500">{shipment.origin} → {shipment.destination}</div>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={shipment.status} />
                        </td>
                        <td className="p-3 text-center text-slate-400 font-mono italic">
                          {shipment.originalETA}
                        </td>
                        <td className="p-3 text-center text-blue-600 font-bold font-mono">
                          {shipment.optimizedETA || "—"}
                        </td>
                        <td className="p-3 text-right">
                          {shipment.canReroute ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReroute(shipment.id);
                              }}
                              disabled={isRerouting === shipment.id}
                              className={`${isDelayed ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'} text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg disabled:opacity-50 cursor-pointer transition-all`}
                            >
                              {isRerouting === shipment.id ? "Analyzing..." : (isRiskTable ? "Reroute Now" : "Optimize")}
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Monitoring</span>
                          )}
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50/80 p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                      <Box className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cargo Payload</p>
                                      <p className="text-sm font-semibold text-slate-700">{shipment.cargo}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                      <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Telemetry</p>
                                      <p className="text-sm font-mono text-slate-700 italic">
                                        {shipment.currentLocation.lat.toFixed(4)}°N, {shipment.currentLocation.lng.toFixed(4)}°E
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ShipmentStatus }) {
  switch (status) {
    case ShipmentStatus.ON_TRACK:
      return (
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-bold text-[10px] uppercase">
          ON TRACK
        </span>
      );
    case ShipmentStatus.DELAYED:
      return (
        <span className="px-2 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-bold text-[10px] uppercase">
          DELAYED
        </span>
      );
    case ShipmentStatus.REROUTING:
      return (
        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold text-[10px] uppercase animate-pulse">
          REROUTING
        </span>
      );
    default:
      return null;
  }
}

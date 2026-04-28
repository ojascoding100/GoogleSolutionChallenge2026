/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  Globe, 
  Layers, 
  Terminal, 
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { MetricsGrid } from "./components/MetricsGrid";
import { MapDisplay } from "./components/MapDisplay";
import { IntelligenceInput } from "./components/IntelligenceInput";
import { ShipmentTable } from "./components/ShipmentTable";
import { RiskFeed } from "./components/RiskFeed";
import { INITIAL_SHIPMENTS } from "./constants";
import { parseNewsRisk } from "./services/geminiService";
import { fetchRoadPath } from "./services/navigationService";
import { 
  Shipment, 
  RiskEvent, 
  DashboardMetrics, 
  ShipmentStatus, 
  Coordinates 
} from "./types";

// Helper function to calculate distance between two coordinates in km
function calculateDistance(code1: Coordinates, code2: Coordinates) {
  const R = 6371; // Radius of the earth in km
  const dLat = (code2.lat - code1.lat) * (Math.PI / 180);
  const dLon = (code2.lng - code1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(code1.lat * (Math.PI / 180)) *
      Math.cos(code2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [risks, setRisks] = useState<RiskEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeRisks: 0,
    averageDelay: 1.2,
    fuelEfficiency: 92.4
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'risks' | 'optimization'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRerouting, setIsRerouting] = useState<string | null>(null);
  const [isOptimizingAll, setIsOptimizingAll] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTransportType, setActiveTransportType] = useState<'sea' | 'inland'>('sea');

  // Automated News Intel Fetcher
  useEffect(() => {
    const newsInterval = setInterval(() => {
      const headlines = [
        "Major storm detected in North Atlantic shipping lanes",
        "Port congestion reported in Singapore due to labor strikes",
        "Suez Canal transit times increased by 24 hours",
        "Piracy alert heightened in Gulf of Aden",
        "Drought affects Panama Canal water levels, restricting draft",
        "Heavy monsoon rains in Maharashtra causing road blockages on Mumbai-Pune expressway",
        "Interstate border checkpost strike reported near Delhi-NCR",
        "Technical breakdown at NH-8 tolls causing 10km truck backup",
        "Dense fog in North India reduces trucking speed to 20km/h"
      ];
      
      const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      
      // Only add if not already in risks (using simplified logic for demo)
      if (risks.length < 10) {
        handleAnalyze(randomHeadline);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(newsInterval);
  }, [risks]);

  useEffect(() => {
    const fetchPaths = async () => {
      const updatedShipments = await Promise.all(shipments.map(async (s) => {
        if (s.transportType === 'inland' && !s.roadPath) {
          const roadPath = await fetchRoadPath(s.originCoords, s.destinationCoords, s.route.slice(1, -1));
          return { ...s, roadPath };
        }
        return s;
      }));
      setShipments(updatedShipments);
    };

    // Wait slightly for Google Maps to be available via useJsApiLoader in MapDisplay
    const timer = setTimeout(fetchPaths, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Real-time Simulation: Move shipments safely along routes and re-evaluate risks
  useEffect(() => {
    const interval = setInterval(() => {
      setShipments(prevShipments => prevShipments.map(shipment => {
        // Use roadPath if available (for precise inland tracking), otherwise use basic route (sea)
        const activePath = (shipment.transportType === 'inland' && shipment.roadPath) ? shipment.roadPath : shipment.route;
        
        let nextTargetIndex = 1;
        let minNextTargetIndex = 1;
        
        // Tolerance for waypoint arrival (smaller for dense road paths)
        const arrivalTolerance = shipment.roadPath ? 10 : 150; 

        // Determine which waypoint we are heading towards
        for (let i = 0; i < activePath.length; i++) {
          const pt = activePath[i];
          const dist = calculateDistance(shipment.currentLocation, pt);
          if (dist < arrivalTolerance) { 
            minNextTargetIndex = i + 1;
          }
        }
        nextTargetIndex = Math.min(Math.max(minNextTargetIndex, 1), activePath.length - 1);
        const target = activePath[nextTargetIndex];
        
        // Move shipment slightly toward the next waypoint with steady speed
        const speedFactor = shipment.transportType === 'inland' ? 0.04 : 0.01; 
        
        const latDelta = (target.lat - shipment.currentLocation.lat) * speedFactor;
        const lngDelta = (target.lng - shipment.currentLocation.lng) * speedFactor;
        
        const newLocation = {
          lat: shipment.currentLocation.lat + latDelta,
          lng: shipment.currentLocation.lng + lngDelta
        };

        // Check if now entering any risk zones or if future path intersects
        let isAtRisk = false;
        risks.forEach(risk => {
          // Check current location
          if (calculateDistance(newLocation, risk.coordinates) <= risk.impactRadius) {
            isAtRisk = true;
          }
          // Check future waypoints in the current route
          shipment.route.slice(nextTargetIndex).forEach(wp => {
            if (calculateDistance(wp, risk.coordinates) <= risk.impactRadius) {
              isAtRisk = true;
            }
          });
        });

        const newStatus = (isAtRisk && !shipment.isOptimized) ? ShipmentStatus.DELAYED : 
                         (shipment.status === ShipmentStatus.DELAYED || shipment.isOptimized ? ShipmentStatus.ON_TRACK : shipment.status);

        return {
          ...shipment,
          currentLocation: newLocation,
          status: newStatus
        };
      }));
    }, 1000); // Update every 1 second for smoother movement

    return () => clearInterval(interval);
  }, [risks]);

  // Update metrics whenever shipments or risks change
  useEffect(() => {
    const activeShipments = shipments.filter(s => s.transportType === activeTransportType);
    const delayedCount = activeShipments.filter(s => s.status === ShipmentStatus.DELAYED).length;
    
    // Categorize risks to match transport type for metrics
    const isIndiaInland = (coords: Coordinates) => {
      return coords.lat >= 5 && coords.lat <= 38 && coords.lng >= 65 && coords.lng <= 100;
    };
    const relevantRisksCount = risks.filter(r => {
      const inIndia = isIndiaInland(r.coordinates);
      return activeTransportType === 'inland' ? inIndia : !inIndia;
    }).length;

    setMetrics(prev => ({
      ...prev,
      activeRisks: relevantRisksCount,
      averageDelay: 1.2 + (delayedCount * 4.5), 
      fuelEfficiency: 92.4 - (relevantRisksCount * 1.5)
    }));
  }, [shipments, risks, activeTransportType]);

  // Handle Intelligence Analysis
  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const riskData = await parseNewsRisk(text);
      setApiError(null);
      if (riskData) {
        const newRisk: RiskEvent = {
          id: `RISK-${Date.now()}`,
          location: riskData.location || "Unknown",
          coordinates: riskData.coordinates || { lat: 0, lng: 0 },
          severity: riskData.severity || "Medium",
          impactRadius: riskData.impactRadius || 200,
          description: riskData.description || "No details available",
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC'
        };

        setRisks(prev => [newRisk, ...prev]);

        // Check for shipments in impact zone (current or future path)
        setShipments(prev => prev.map(shipment => {
          let intersects = false;
          // Check current location
          if (calculateDistance(shipment.currentLocation, newRisk.coordinates) <= newRisk.impactRadius) {
            intersects = true;
          }
          // Check route waypoints
          shipment.route.forEach(wp => {
            if (calculateDistance(wp, newRisk.coordinates) <= newRisk.impactRadius) {
              intersects = true;
            }
          });

          if (intersects) {
            return { ...shipment, status: ShipmentStatus.DELAYED };
          }
          return shipment;
        }));
      }
    } catch (error: any) {
      console.error("Analysis Failed", error);
      if (error?.message?.includes("429") || error?.status === 429) {
        setApiError("AI Quota Exceeded. Using simulated risk analysis.");
      } else {
        setApiError("Intelligence Engine error. Please try again.");
      }
      // Auto-clear after 10 seconds
      setTimeout(() => setApiError(null), 10000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Rerouting
  const handleReroute = async (id: string) => {
    setIsRerouting(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const shipmentToUpdate = shipments.find(s => s.id === id);
    if (!shipmentToUpdate) {
      setIsRerouting(null);
      return;
    }

    const relevantRisks = risks.filter(r => 
      calculateDistance(shipmentToUpdate.currentLocation, r.coordinates) <= r.impactRadius + 300
    );

    let newRoute = [...shipmentToUpdate.route];
    let newRoadPath: Coordinates[] | undefined = undefined;

    if (relevantRisks.length > 0) {
      const risk = relevantRisks[0];
      const dLat = shipmentToUpdate.currentLocation.lat - risk.coordinates.lat;
      const dLng = shipmentToUpdate.currentLocation.lng - risk.coordinates.lng;
      const mag = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
      
      const bufferKm = shipmentToUpdate.transportType === 'sea' ? 300 : 50;
      const safetyMarginDeg = (risk.impactRadius + bufferKm) / 111;
      const perpOffset = shipmentToUpdate.transportType === 'sea' ? 2 : 0.4;
      
      const detour1 = {
        lat: risk.coordinates.lat + (dLat / mag) * safetyMarginDeg + (dLng / mag) * perpOffset, 
        lng: risk.coordinates.lng + (dLng / mag) * safetyMarginDeg - (dLat / mag) * perpOffset
      };

      const dLatDest = shipmentToUpdate.destinationCoords.lat - risk.coordinates.lat;
      const dLngDest = shipmentToUpdate.destinationCoords.lng - risk.coordinates.lng;
      const magDest = Math.sqrt(dLatDest * dLatDest + dLngDest * dLngDest) || 1;

      const detour2 = {
        lat: risk.coordinates.lat + (dLatDest / magDest) * safetyMarginDeg,
        lng: risk.coordinates.lng + (dLngDest / magDest) * safetyMarginDeg
      };
      
      newRoute = [
        shipmentToUpdate.currentLocation,
        detour1,
        detour2,
        shipmentToUpdate.destinationCoords
      ];

      // Fetch accurate road-snapped path for inland detour
      if (shipmentToUpdate.transportType === 'inland') {
        newRoadPath = await fetchRoadPath(shipmentToUpdate.currentLocation, shipmentToUpdate.destinationCoords, [detour1, detour2]);
      }
    }

    setShipments(prev => prev.map(shipment => {
      if (shipment.id === id) {
        return {
          ...shipment,
          status: ShipmentStatus.ON_TRACK,
          isOptimized: true,
          lastReroutedAt: Date.now(),
          originalRoute: shipment.originalRoute || [...shipment.route],
          route: newRoute,
          roadPath: newRoadPath || shipment.roadPath,
          optimizedETA: new Date(new Date(shipment.originalETA).getTime() + 86400000).toISOString().split('T')[0]
        };
      }
      return shipment;
    }));
    setIsRerouting(null);
  };

  const handleRecalculateAll = async () => {
    setIsOptimizingAll(true);
    // Identify all shipments that might need a reroute (at risk or delayed)
    const toReroute = shipments.filter(s => 
      s.transportType === activeTransportType && 
      (s.status === ShipmentStatus.DELAYED || risks.some(r => calculateDistance(s.currentLocation, r.coordinates) <= r.impactRadius + 200))
    );
    
    for (const shipment of toReroute) {
      await handleReroute(shipment.id);
    }
    
    setIsOptimizingAll(false);
  };

  const processedShipments = shipments
    .filter(s => s.transportType === activeTransportType)
    .map(s => ({
      ...s,
      canReroute: s.status === ShipmentStatus.DELAYED || risks.some(r => calculateDistance(s.currentLocation, r.coordinates) <= r.impactRadius + 300)
    }));

  const isIndiaInland = (coords: Coordinates) => {
    return coords.lat >= 5 && coords.lat <= 38 && coords.lng >= 65 && coords.lng <= 100;
  };

  const filteredRisks = risks.filter(r => {
    const inIndia = isIndiaInland(r.coordinates);
    return activeTransportType === 'inland' ? inIndia : !inIndia;
  });

  const affectedShipments = processedShipments.filter(s => {
    const isAtRiskAndNotOptimized = s.status === ShipmentStatus.DELAYED && !s.isOptimized;
    const isInBuffer = s.lastReroutedAt && (Date.now() - s.lastReroutedAt < 120000); // 2 minute buffer
    return isAtRiskAndNotOptimized || isInBuffer;
  });

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans overflow-hidden text-slate-800">
      {/* Top Navigation Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">L</div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">LogiSense <span className="text-indigo-600 font-bold">AI</span></span>
          </div>
          
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'risks', label: 'Risk Center' },
              { id: 'optimization', label: 'Route Optimization' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button 
              onClick={() => setActiveTransportType('sea')}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTransportType === 'sea' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Maritime
            </button>
            <button 
              onClick={() => setActiveTransportType('inland')}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTransportType === 'inland' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inland India
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 uppercase tracking-widest font-medium text-[10px]">Auto-Intelligence Active</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <span className="text-slate-500 text-sm">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} UTC</span>
        </div>
      </header>

      {apiError && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-amber-50 border border-amber-200 px-6 py-2.5 rounded-full shadow-xl flex items-center gap-3"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">{apiError}</span>
          <button onClick={() => setApiError(null)} className="text-amber-400 hover:text-amber-600 font-bold ml-2">✕</button>
        </motion.div>
      )}

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Intelligence & Control (Shared) */}
        <aside className="w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
          <MetricsGrid metrics={metrics} />
          
          <div className="flex-1 flex flex-col p-4 border-t border-slate-200">
            <IntelligenceInput 
              onAnalyze={handleAnalyze} 
              isAnalyzing={isAnalyzing} 
            />
          </div>

          <div className="h-72 border-t border-slate-200 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Signals Feed</h3>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Scanning...</span>
            </div>
            <RiskFeed risks={filteredRisks} />
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="absolute inset-0 flex flex-col overflow-y-auto"
              >
                <section className="h-[400px] shrink-0 relative bg-white overflow-hidden border-b border-slate-200">
                  <MapDisplay 
                    shipments={shipments.filter(s => s.transportType === activeTransportType)} 
                    risks={filteredRisks} 
                  />
                  <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                    <h2 className="text-2xl font-light text-slate-400 uppercase tracking-tight">
                      {activeTransportType === 'sea' ? 'Global' : 'Regional'} <span className="text-slate-900 font-bold">{activeTransportType === 'sea' ? 'Predictive Map' : 'Inland Logistics'}</span>
                    </h2>
                  </div>
                </section>

                <section className="flex-1 bg-white p-6 flex flex-col gap-8">
                    {affectedShipments.length > 0 && (
                      <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100 shadow-xl shadow-rose-900/5">
                        <ShipmentTable 
                          shipments={affectedShipments} 
                          onReroute={handleReroute} 
                          isRerouting={isRerouting}
                          onRecalculateAll={handleRecalculateAll}
                          isOptimizingAll={isOptimizingAll}
                          title="Threat Mitigation Queue - Immediate Reroute Required"
                          isRiskTable={true}
                        />
                      </div>
                    )}

                    <ShipmentTable 
                      shipments={processedShipments} 
                      onReroute={handleReroute} 
                      isRerouting={isRerouting}
                      onRecalculateAll={handleRecalculateAll}
                      isOptimizingAll={isOptimizingAll}
                      title="Live Fleet Overview"
                    />
                </section>
              </motion.div>
            )}

            {activeTab === 'risks' && (
              <motion.div 
                key="risks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 bg-white p-8 overflow-y-auto"
              >
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Threats</h1>
                      <p className="text-slate-500 mt-2 text-lg">Real-time risk assessment and intervention queue.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-rose-50 border border-secondary-100 px-8 py-6 rounded-2xl shadow-sm">
                        <p className="text-xs font-black text-rose-400 uppercase mb-2 tracking-widest">High Severity</p>
                        <p className="text-4xl font-black text-rose-600">{filteredRisks.filter(r => r.severity === 'High').length}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 px-8 py-6 rounded-2xl shadow-sm">
                        <p className="text-xs font-black text-amber-400 uppercase mb-2 tracking-widest">Medium Severity</p>
                        <p className="text-4xl font-black text-amber-600">{filteredRisks.filter(r => r.severity === 'Medium').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-10">
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
                        <h2 className="text-xl font-black text-slate-800">Critical Interventions</h2>
                      </div>
                      <div className="bg-white border-2 border-rose-100 rounded-3xl p-6 shadow-xl shadow-rose-900/5">
                        <ShipmentTable 
                          shipments={affectedShipments} 
                          onReroute={handleReroute} 
                          isRerouting={isRerouting}
                          onRecalculateAll={handleRecalculateAll}
                          isOptimizingAll={isOptimizingAll}
                          title=""
                          isRiskTable={true}
                        />
                      </div>
                    </section>
                    
                    <section>
                      <h2 className="text-xl font-bold text-slate-800 mb-6 px-1">Global Signal History</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRisks.map((risk) => (
                          <div key={risk.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${
                                risk.severity === 'High' ? 'bg-rose-500' : 
                                risk.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                              }`}>
                                {risk.severity[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{risk.location}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 uppercase font-bold tracking-tight">Signal: {risk.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 mb-1">{risk.timestamp}</p>
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                risk.severity === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {risk.severity} RADAR
                              </span>
                            </div>
                          </div>
                        ))}
                        {risks.length === 0 && (
                          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                            <p className="text-slate-400 font-medium font-mono">NO ACTIVE THREATS REGISTERED</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'optimization' && (
              <motion.div 
                key="optimization"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 bg-white p-8 overflow-y-auto"
              >
                <div className="max-w-5xl mx-auto">
                   <div className="mb-10">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight">Optimization Center</h1>
                      <p className="text-slate-500 mt-2 text-lg">Autonomous rerouting engine and fleet analytics.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                       <div className="lg:col-span-2 space-y-8">
                         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                           <h2 className="text-xl font-bold text-slate-800 mb-6">Autonomous Fleet Queue</h2>
                           <ShipmentTable 
                              shipments={processedShipments} 
                              onReroute={handleReroute} 
                              isRerouting={isRerouting}
                              onRecalculateAll={handleRecalculateAll}
                              isOptimizingAll={isOptimizingAll}
                              title=""
                            />
                         </div>
                       </div>
                       
                       <div className="space-y-6">
                         <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-3">Efficiency Alpha</h3>
                           <p className="text-5xl font-black mb-6">+18.4%</p>
                           <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">Average transit time reduction across all optimized fleet routes this quarter.</p>
                         </div>

                         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Engine Insights</h3>
                           <div className="space-y-6">
                             <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                               <p className="text-sm font-bold text-slate-800">Suez Congestion Forecast</p>
                               <p className="text-xs text-slate-500 mt-2 leading-relaxed">Signals suggest heavy congestion. Pre-emptive rerouting via Cape for SHIP-004 recommended to avoid 4 day delay.</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-500">
                               <p className="text-sm font-bold text-slate-800">Dynamic Speed Adjustment</p>
                               <p className="text-xs text-slate-500 mt-2 leading-relaxed">SHIP-001 adjusted to 14.5 knots. Optimized arrival window achieved with 6% fuel reduction.</p>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <div className={`p-3 rounded-xl transition-all cursor-pointer group hover:bg-white/5 ${active ? 'text-purple-500' : 'text-gray-500'}`}>
      {icon}
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute left-0 w-1 h-6 bg-purple-500 rounded-r-full shadow-[4px_0_12px_rgba(168,85,247,0.4)]"
        />
      )}
    </div>
  );
}


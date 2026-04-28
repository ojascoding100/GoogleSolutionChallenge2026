import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle, Polyline, InfoWindow } from "@react-google-maps/api";
import { motion, AnimatePresence } from "motion/react";
import { ZoomIn, ZoomOut, MapPin, AlertTriangle, Navigation, Globe } from "lucide-react";
import { Shipment, RiskEvent, ShipmentStatus } from "../types";

interface MapDisplayProps {
  shipments: Shipment[];
  risks: RiskEvent[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 20,
  lng: 0
};

// Custom styling for a clean, light mode look
const mapStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#e9e9e9" }]
  }
];

export function MapDisplay({ shipments, risks }: MapDisplayProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredShipmentId, setHoveredShipmentId] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ''
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const handleZoom = (delta: number) => {
    if (map) {
      const zoom = map.getZoom() || 2;
      map.setZoom(zoom + delta);
    }
  };

  if (loadError) {
    return (
      <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Map Load Error</h3>
        <p className="text-slate-500 max-w-xs mt-2">Could not initialize Google Maps. Please check your API key configuration in .env.</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <Globe className="w-12 h-12 text-indigo-500 mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-900">Map Integration Required</h3>
        <p className="text-slate-500 max-w-xs mt-2">Please provide a valid Google Maps API key in the Secrets panel to activate live tracking.</p>
        <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-left max-w-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Simulated Data Active</p>
          <p className="text-xs text-slate-500 leading-relaxed font-mono">
            {shipments.length} vessels tracked via SVG simulation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-50 overflow-hidden">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={2}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {/* Risk Zones */}
          {risks.map((risk) => (
            <Circle
              key={risk.id}
              center={{ lat: risk.coordinates.lat, lng: risk.coordinates.lng }}
              radius={risk.impactRadius * 1000} // Radius in meters
              options={{
                fillColor: risk.severity === 'High' ? '#f43f5e' : risk.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                fillOpacity: 0.1,
                strokeColor: risk.severity === 'High' ? '#f43f5e' : risk.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                strokeOpacity: 0.3,
                strokeWeight: 1,
              }}
            />
          ))}

          {/* Shipment Routes & Markers */}
          {shipments.map((shipment) => {
            const isDelayed = shipment.status === ShipmentStatus.DELAYED;
            const isHovered = hoveredShipmentId === shipment.id;

            return (
              <React.Fragment key={shipment.id}>
                {/* Original Route (Faded after reroute) */}
                {shipment.isOptimized && shipment.originalRoute && (
                  <Polyline
                    path={shipment.originalRoute}
                    options={{
                      geodesic: true,
                      strokeColor: '#94a3b8',
                      strokeOpacity: 0.2,
                      strokeWeight: 1,
                      icons: [{
                        icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.4, scale: 2 },
                        offset: '0',
                        repeat: '15px'
                      }]
                    }}
                  />
                )}

                {/* Route Line */}
                <Polyline
                  path={shipment.roadPath || shipment.route}
                  options={{
                    geodesic: true,
                    strokeColor: isDelayed ? '#f43f5e' : (shipment.isOptimized ? '#10b981' : '#64748b'), 
                    strokeOpacity: shipment.isOptimized ? 0.9 : 0.4,
                    strokeWeight: shipment.transportType === 'inland' ? 3 : (shipment.isOptimized ? 4 : 2),
                    icons: [{
                      icon: { path: (shipment.transportType === 'inland' && !shipment.isOptimized) ? 'M -2,0 L 2,0' : 'M 0,-1 0,1', strokeOpacity: 0.6, scale: 2 },
                      offset: '0',
                      repeat: shipment.transportType === 'inland' ? '15px' : '10px'
                    }]
                  }}
                />

                {/* Traveled Path (Connection to current location) */}
                <Polyline
                  path={[shipment.originCoords, shipment.currentLocation]}
                  options={{
                    geodesic: true,
                    strokeColor: isDelayed ? '#ef4444' : (shipment.isOptimized ? '#10b981' : '#94a3b8'),
                    strokeOpacity: 0.8,
                    strokeWeight: shipment.isOptimized ? 4 : 2,
                  }}
                />

                {/* Tracking Marker */}
                <Marker
                  position={{ lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }}
                  onMouseOver={() => setHoveredShipmentId(shipment.id)}
                  onMouseOut={() => setHoveredShipmentId(null)}
                  icon={{
                    path: shipment.transportType === 'sea' 
                      ? "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.37c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.95 19zM6 6h12v3.97L12 12 6 9.97V6z" // Boat icon path
                      : "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z", // Truck icon path
                    fillColor: isDelayed ? '#f43f5e' : (shipment.isOptimized ? '#059669' : '#10b981'),
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                    scale: shipment.transportType === 'sea' ? 1.0 : 1.4,
                    anchor: new google.maps.Point(12, 12),
                  }}
                />

                {isHovered && (
                  <InfoWindow
                    position={{ lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng }}
                    options={{ pixelOffset: new google.maps.Size(0, -10) }}
                  >
                    <div className="p-2 min-w-[120px]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{shipment.id}</p>
                      <p className="text-xs font-bold text-slate-800">{shipment.cargo}</p>
                      <div className={`mt-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded inline-block ${
                        isDelayed ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {shipment.status}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Map UI Overlay: Legend */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur border border-slate-200 p-3 rounded-2xl z-20 shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Logistics Radar</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-600">ON TRACK</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-600">THREAT ZONE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[10px] font-bold text-slate-600">DELAY RISK</span>
          </div>
        </div>
      </div>

      {/* Map UI Overlay: Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={() => handleZoom(1)}
          className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 transition-colors text-slate-600"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleZoom(-1)}
          className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 transition-colors text-slate-600"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

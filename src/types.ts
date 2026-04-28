export enum ShipmentStatus {
  ON_TRACK = 'On Track',
  DELAYED = 'Delayed',
  REROUTING = 'Rerouting',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  originCoords: Coordinates;
  destinationCoords: Coordinates;
  currentLocation: Coordinates;
  route: Coordinates[]; // Added for realistic sea routes
  status: ShipmentStatus;
  originalETA: string;
  optimizedETA?: string;
  cargo:string;
  canReroute?: boolean;
  isOptimized?: boolean;
  lastReroutedAt?: number;
  originalRoute?: Coordinates[];
  transportType: 'sea' | 'inland';
  roadPath?: Coordinates[];
}

export interface RiskEvent {
  id: string;
  location: string;
  coordinates: Coordinates;
  severity: 'Low' | 'Medium' | 'High';
  impactRadius: number; // in km
  description: string;
  timestamp: string;
}

export interface DashboardMetrics {
  activeRisks: number;
  averageDelay: number; // in hours
  fuelEfficiency: number; // percentage
}

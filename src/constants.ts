import { Shipment, ShipmentStatus } from "./types";

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: "SHIP-001",
    origin: "Shanghai, CN",
    destination: "Hamburg, DE",
    originCoords: { lat: 31.2304, lng: 121.4737 },
    destinationCoords: { lat: 53.5511, lng: 9.9937 },
    currentLocation: { lat: 10.0, lng: 105.0 },
    route: [
      { lat: 31.2304, lng: 121.4737 }, // Shanghai
      { lat: 12.0, lng: 110.0 },      // South China Sea
      { lat: 5.6, lng: 95.0 },        // Malacca Strait
      { lat: 12.0, lng: 52.0 },       // Gulf of Aden
      { lat: 30.0, lng: 32.5 },       // Suez Canal
      { lat: 36.0, lng: -5.6 },       // Gibraltar
      { lat: 48.0, lng: -5.0 },       // English Channel
      { lat: 53.5511, lng: 9.9937 }   // Hamburg
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-15",
    cargo: "Consumer Electronics",
    transportType: 'sea'
  },
  {
    id: "SHIP-002",
    origin: "Singapore, SG",
    destination: "Rotterdam, NL",
    originCoords: { lat: 1.3521, lng: 103.8198 },
    destinationCoords: { lat: 51.9225, lng: 4.47917 },
    currentLocation: { lat: 2.0, lng: 100.0 },
    route: [
      { lat: 1.3521, lng: 103.8198 }, // Singapore
      { lat: 12.0, lng: 50.0 },       // Gulf of Aden
      { lat: 30.0, lng: 32.5 },       // Suez
      { lat: 36.5, lng: -5.0 },       // Gibraltar
      { lat: 51.9225, lng: 4.47917 }  // Rotterdam
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-18",
    cargo: "Automotive Parts",
    transportType: 'sea'
  },
  {
    id: "SHIP-003",
    origin: "Dubai, AE",
    destination: "Los Angeles, US",
    originCoords: { lat: 25.2048, lng: 55.2708 },
    destinationCoords: { lat: 33.7, lng: -118.2 },
    currentLocation: { lat: 5.0, lng: 80.0 },
    route: [
      { lat: 25.2048, lng: 55.2708 }, // Dubai
      { lat: 5.0, lng: 80.0 },        // Indian Ocean
      { lat: -10.0, lng: 115.0 },     // Indonesia
      { lat: 15.0, lng: 160.0 },      // Pacific
      { lat: 33.7, lng: -118.2 }      // Los Angeles
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-10",
    cargo: "Textiles",
    transportType: 'sea'
  },
  {
    id: "SHIP-004",
    origin: "Mumbai, IN",
    destination: "London, UK",
    originCoords: { lat: 19.0760, lng: 72.8777 },
    destinationCoords: { lat: 51.5074, lng: -0.1278 },
    currentLocation: { lat: 12.0, lng: 60.0 },
    route: [
      { lat: 19.0760, lng: 72.8777 }, // Mumbai
      { lat: 10.0, lng: 50.0 },       // Guardafui
      { lat: 30.0, lng: 32.5 },       // Suez
      { lat: 36.5, lng: -2.0 },       // Med
      { lat: 50.0, lng: -1.0 },       // Channel
      { lat: 51.5074, lng: -0.1278 }  // London
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-22",
    cargo: "Pharmaceuticals",
    transportType: 'sea'
  },
  {
    id: "TRUCK-001",
    origin: "Delhi, IN",
    destination: "Mumbai, IN",
    originCoords: { lat: 28.6139, lng: 77.2090 },
    destinationCoords: { lat: 19.0760, lng: 72.8777 },
    currentLocation: { lat: 26.0, lng: 75.0 },
    route: [
      { lat: 28.6139, lng: 77.2090 }, // Delhi
      { lat: 26.9124, lng: 75.7873 }, // Jaipur
      { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
      { lat: 19.0760, lng: 72.8777 }  // Mumbai
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-02",
    cargo: "Agricultural Goods",
    transportType: 'inland'
  },
  {
    id: "TRUCK-002",
    origin: "Chennai, IN",
    destination: "Bangalore, IN",
    originCoords: { lat: 13.0827, lng: 80.2707 },
    destinationCoords: { lat: 12.9716, lng: 77.5946 },
    currentLocation: { lat: 13.0, lng: 79.5 },
    route: [
      { lat: 13.0827, lng: 80.2707 }, // Chennai
      { lat: 12.9141, lng: 79.1325 }, // Vellore
      { lat: 12.9716, lng: 77.5946 }  // Bangalore
    ],
    status: ShipmentStatus.ON_TRACK,
    originalETA: "2024-05-01",
    cargo: "Electronics",
    transportType: 'inland'
  },
  {
    id: "TRUCK-003",
    origin: "Kolkata, IN",
    destination: "Guwahati, IN",
    originCoords: { lat: 22.5726, lng: 88.3639 },
    destinationCoords: { lat: 26.1445, lng: 91.7362 },
    currentLocation: { lat: 24.0, lng: 89.0 },
    route: [
      { lat: 22.5726, lng: 88.3639 }, // Kolkata
      { lat: 24.9123, lng: 88.1324 }, // Malda
      { lat: 26.7271, lng: 88.3953 }, // Siliguri
      { lat: 26.1445, lng: 91.7362 }  // Guwahati
    ],
    status: ShipmentStatus.DELAYED,
    originalETA: "2024-05-04",
    cargo: "Steel Parts",
    transportType: 'inland'
  }
];

export const MAP_CENTER = { lat: 20, lng: 0 };

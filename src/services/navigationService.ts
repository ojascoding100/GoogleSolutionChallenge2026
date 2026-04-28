import { Coordinates } from '../types';

/**
 * Fetches accurate road paths using the Google Maps Directions Service.
 * This is meant to be called once per shipment to cache the high-resolution path.
 */
export async function fetchRoadPath(origin: Coordinates, destination: Coordinates, waypoints: Coordinates[] = []): Promise<Coordinates[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google) {
      // Fallback if Google Maps isn't loaded yet
      resolve([origin, ...waypoints, destination]);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypoints.map(wp => ({
          location: new google.maps.LatLng(wp.lat, wp.lng),
          stopover: true
        })),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes[0]) {
          const path = result.routes[0].overview_path.map(p => ({
            lat: p.lat(),
            lng: p.lng()
          }));
          resolve(path);
        } else {
          console.warn('Directions request failed due to ' + status);
          // Return simple linear route as fallback
          resolve([origin, ...waypoints, destination]);
        }
      }
    );
  });
}

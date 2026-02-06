/**
 * Geographic utility functions for distance calculations and geo operations
 */

export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance to human-readable string
 * @param distanceKm - distance in kilometers
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is near a route (within threshold distance)
 * Uses simple line-segment distance approximation
 */
export function isPointNearRoute(
  point: Coordinates,
  routeStart: Coordinates,
  routeEnd: Coordinates,
  thresholdKm: number = 1
): boolean {
  // Calculate perpendicular distance from point to line segment
  const distToStart = calculateDistance(point, routeStart);
  const distToEnd = calculateDistance(point, routeEnd);

  // If point is very close to either endpoint, it's on the route
  if (distToStart <= thresholdKm || distToEnd <= thresholdKm) {
    return true;
  }

  // Calculate route length
  const routeLength = calculateDistance(routeStart, routeEnd);

  // Simple bounding box check first (optimization)
  const minLat = Math.min(routeStart.lat, routeEnd.lat) - thresholdKm / 111;
  const maxLat = Math.max(routeStart.lat, routeEnd.lat) + thresholdKm / 111;
  const minLng = Math.min(routeStart.lng, routeEnd.lng) - thresholdKm / 111;
  const maxLng = Math.max(routeStart.lng, routeEnd.lng) + thresholdKm / 111;

  if (
    point.lat < minLat ||
    point.lat > maxLat ||
    point.lng < minLng ||
    point.lng > maxLng
  ) {
    return false;
  }

  // Check if point is within threshold of the route line
  // For simplicity, check if the sum of distances to endpoints is close to route length
  const sumDist = distToStart + distToEnd;
  return sumDist - routeLength <= thresholdKm * 2;
}

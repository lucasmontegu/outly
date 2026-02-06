/**
 * HERE Flexible Polyline Decoder
 * Spec: https://github.com/heremaps/flexible-polyline
 *
 * HERE's polyline format is more efficient than Google's:
 * - Supports different precision levels
 * - Smaller encoded strings
 * - 3D coordinates (elevation) support
 */

export function decodeFlexiblePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded) return [];

  const result: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  const decodeUnsignedValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    return result;
  };

  const decodeSignedValue = (): number => {
    const value = decodeUnsignedValue();
    return (value & 1) ? ~(value >> 1) : (value >> 1);
  };

  // First value is header (version and precision)
  const header = decodeUnsignedValue();
  const precision = header & 0x0f;
  const factor = Math.pow(10, precision);

  // Second value is dimension (2D or 3D)
  const dimension = (header >> 4) + 2;

  // Decode coordinates
  while (index < encoded.length) {
    lat += decodeSignedValue();
    lng += decodeSignedValue();

    result.push({
      lat: lat / factor,
      lng: lng / factor,
    });

    // Skip elevation if 3D
    if (dimension === 3) {
      decodeSignedValue();
    }
  }

  return result;
}

/**
 * Sample polyline points at regular distance intervals
 * Useful for placing weather waypoints along the route
 *
 * @param points - Full polyline coordinates
 * @param intervalKm - Distance between samples in kilometers
 * @returns Sampled points with distance from start
 */
export function samplePolylineByDistance(
  points: { lat: number; lng: number }[],
  intervalKm: number = 50
): Array<{ lat: number; lng: number; distanceKm: number }> {
  if (points.length === 0) return [];

  const samples: Array<{ lat: number; lng: number; distanceKm: number }> = [];
  let accumulatedDistance = 0;
  let nextSampleDistance = 0;

  // Always include start point
  samples.push({ ...points[0], distanceKm: 0 });

  for (let i = 1; i < points.length; i++) {
    const segmentDistance = haversineDistance(points[i - 1], points[i]);
    accumulatedDistance += segmentDistance;

    // Check if we crossed a sample point
    while (accumulatedDistance >= nextSampleDistance + intervalKm) {
      nextSampleDistance += intervalKm;

      // Interpolate point at exact sample distance
      const ratio = (nextSampleDistance - (accumulatedDistance - segmentDistance)) / segmentDistance;
      const interpolated = {
        lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * ratio,
        lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * ratio,
        distanceKm: nextSampleDistance,
      };
      samples.push(interpolated);
    }
  }

  // Always include end point if not already added
  const lastSample = samples[samples.length - 1];
  const lastPoint = points[points.length - 1];
  if (lastSample.lat !== lastPoint.lat || lastSample.lng !== lastPoint.lng) {
    samples.push({ ...lastPoint, distanceKm: accumulatedDistance });
  }

  return samples;
}

/**
 * Haversine formula - calculate distance between two points in kilometers
 */
function haversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate total route distance
 */
export function calculateRouteDistance(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Simplify polyline using Douglas-Peucker algorithm
 * Reduces number of points while maintaining shape
 * Useful for performance when route has 1000+ points
 *
 * @param points - Full polyline
 * @param tolerance - Max distance deviation in kilometers (default 0.1km)
 */
export function simplifyPolyline(
  points: { lat: number; lng: number }[],
  tolerance: number = 0.1
): { lat: number; lng: number }[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;

  // Find point with maximum distance from line between first and last
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolyline(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, return just start and end
  return [points[0], points[points.length - 1]];
}

function perpendicularDistance(
  point: { lat: number; lng: number },
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number }
): number {
  const x = point.lat;
  const y = point.lng;
  const x1 = lineStart.lat;
  const y1 = lineStart.lng;
  const x2 = lineEnd.lat;
  const y2 = lineEnd.lng;

  const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

  return numerator / denominator;
}

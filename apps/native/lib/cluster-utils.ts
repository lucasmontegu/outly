export type ClusterPoint = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  count: number;
  eventIds: string[];
};

/**
 * Groups nearby events into clusters using grid-based bucketing.
 * O(n) complexity: assigns events to grid cells, then merges cells.
 * Events in the same or adjacent cells become one cluster.
 */
export function clusterEvents<T extends { _id: string; location: { lat: number; lng: number } }>(
  events: T[],
  gridSizeKm: number = 2
): { clusters: ClusterPoint[]; singles: T[] } {
  if (events.length === 0) return { clusters: [], singles: [] };

  // ~0.018 degrees per km at mid-latitudes
  const gridDeg = gridSizeKm * 0.018;

  // Bucket events into grid cells
  const buckets = new Map<string, T[]>();
  for (const event of events) {
    const cellX = Math.floor(event.location.lng / gridDeg);
    const cellY = Math.floor(event.location.lat / gridDeg);
    const key = `${cellX}_${cellY}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(event);
    } else {
      buckets.set(key, [event]);
    }
  }

  // Merge adjacent cells using union-find on cell keys
  const clusters: ClusterPoint[] = [];
  const singles: T[] = [];
  const mergedCells = new Set<string>();

  for (const [key, bucket] of buckets) {
    if (mergedCells.has(key)) continue;

    // Gather events from this cell + all 8 adjacent cells
    const [cellX, cellY] = key.split("_").map(Number);
    const groupEvents: T[] = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${cellX + dx}_${cellY + dy}`;
        const neighborBucket = buckets.get(neighborKey);
        if (neighborBucket && !mergedCells.has(neighborKey)) {
          groupEvents.push(...neighborBucket);
          mergedCells.add(neighborKey);
        }
      }
    }

    if (groupEvents.length <= 1) {
      singles.push(...groupEvents);
    } else {
      const centroid = calculateCentroid(groupEvents.map((e) => e.location));
      clusters.push({
        id: `cluster-${groupEvents[0]._id}`,
        coordinate: { latitude: centroid.lat, longitude: centroid.lng },
        count: groupEvents.length,
        eventIds: groupEvents.map((e) => e._id),
      });
    }
  }

  return { clusters, singles };
}

function calculateCentroid(
  coords: { lat: number; lng: number }[]
): { lat: number; lng: number } {
  if (coords.length === 0) return { lat: 0, lng: 0 };
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

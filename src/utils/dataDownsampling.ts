import { APIVitalReading } from '@/types/patient';

/**
 * Downsamples data points for efficient chart rendering using LTTB algorithm
 * (Largest Triangle Three Buckets) - maintains visual accuracy while reducing points
 */
export function downsampleData(data: APIVitalReading[], targetPoints: number): APIVitalReading[] {
  if (data.length <= targetPoints || targetPoints < 3) {
    return data;
  }

  const sampled: APIVitalReading[] = [];

  // Always include first point
  sampled.push(data[0]);

  // Calculate bucket size
  const bucketSize = (data.length - 2) / (targetPoints - 2);

  let a = 0; // Previous selected point

  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i) * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Find average point in next bucket for triangle calculation
    let avgX = 0;
    let avgY = 0;
    const nextBucketStart = bucketEnd;
    const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);

    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += j;
      avgY += data[j].Pulse; // Use pulse as primary metric for sampling
    }
    avgX /= (nextBucketEnd - nextBucketStart);
    avgY /= (nextBucketEnd - nextBucketStart);

    // Find point in current bucket with largest triangle area
    let maxArea = -1;
    let maxIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      // Calculate triangle area
      const area = Math.abs(
        (a - avgX) * (data[j].Pulse - data[a].Pulse) -
        (a - j) * (avgY - data[a].Pulse)
      );

      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    a = maxIndex;
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Intelligent sampling based on time range - optimized for visual quality
 */
export function getOptimalSampleSize(hours: number, totalPoints: number): number {
  // Maximum points to render smoothly while maintaining visual quality
  const MAX_POINTS = 500; // Increased for better visual quality

  // Minimum points for good visualization
  const MIN_POINTS = 50; // Increased minimum for smoother curves

  // Calculate ideal points based on time range
  let idealPoints: number;

  if (hours <= 1) {
    idealPoints = Math.min(totalPoints, 120); // 2 points per minute for smooth curves
  } else if (hours <= 6) {
    idealPoints = Math.min(totalPoints, 180); // ~1 point per 2 minutes
  } else if (hours <= 12) {
    idealPoints = Math.min(totalPoints, 250); // ~1 point per 3 minutes - good detail
  } else if (hours <= 24) {
    idealPoints = Math.min(totalPoints, 350); // ~1 point per 4 minutes - maintains trends
  } else if (hours <= 168) { // 1 week
    idealPoints = Math.min(totalPoints, MAX_POINTS); // ~1 point per 20 minutes - smooth weekly view
  } else {
    idealPoints = Math.min(totalPoints, MAX_POINTS);
  }

  // Ensure we're within bounds
  return Math.max(MIN_POINTS, Math.min(idealPoints, MAX_POINTS, totalPoints));
}

/**
 * Progressive loading helper - returns subset of data for initial render
 */
export function getInitialDataSubset(data: APIVitalReading[], hours: number): APIVitalReading[] {
  if (data.length === 0) return [];

  // For initial render, show less points
  const initialPoints = Math.min(30, data.length);

  // Take evenly spaced points for initial render
  if (data.length <= initialPoints) {
    return data;
  }

  const step = Math.floor(data.length / initialPoints);
  const subset: APIVitalReading[] = [];

  for (let i = 0; i < data.length; i += step) {
    subset.push(data[i]);
  }

  // Always include last point
  if (subset[subset.length - 1] !== data[data.length - 1]) {
    subset.push(data[data.length - 1]);
  }

  return subset;
}

/**
 * Debounce helper for chart updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
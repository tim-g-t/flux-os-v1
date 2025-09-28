/**
 * Utility script to regenerate test data
 * Use this to easily update vitals.json with fresh test data
 */

import { generateCurrentVitals, getVitalsJsonData } from '@/data/testData';

export const regenerateVitalsData = () => {
  return generateCurrentVitals();
};

export const getFormattedVitalsJson = () => {
  return getVitalsJsonData();
};

// Console helper for manual data generation
export const logNewVitalsData = () => {
  console.log('=== NEW VITALS DATA ===');
  console.log(getFormattedVitalsJson());
  console.log('=== END DATA ===');
  console.log('Copy the above JSON to public/vitals.json to update test data');
};

// For development: automatically log new data
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Uncomment the line below to auto-generate new test data on page load
  // logNewVitalsData();
}
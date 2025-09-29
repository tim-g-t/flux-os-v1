// Script to clear cache and restart
console.log('🧹 Clearing patient data cache...');

// Clear localStorage cache key
const CACHE_KEY = 'patient_data_cache';
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(CACHE_KEY);
  console.log('✅ Cache cleared successfully');
} else {
  console.log('⚠️  Note: Cache will be cleared when the app loads in browser');
}

console.log('🔄 Please restart the development server with: npm run dev');
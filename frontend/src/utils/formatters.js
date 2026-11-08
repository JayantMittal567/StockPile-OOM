// Utility formatters and helper functions for Stockpile

export function formatPaise(paise = 0) {
  const rupees = (Number(paise) || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}

// Convert paise to raw rupees number for input editing
export function paiseToRupees(paise = 0) {
  return (Number(paise) || 0) / 100;
}

// Convert rupees to paise integer
export function rupeesToPaise(rupees = 0) {
  return Math.round((Number(rupees) || 0) * 100);
}

// Get current date string in Asia/Kolkata timezone (YYYY-MM-DD)
export function getKolkataToday() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Format SQLite timestamp string cleanly
export function formatDateTime(ts) {
  if (!ts) return '—';
  try {
    const clean = ts.replace('T', ' ').split('.')[0];
    return clean;
  } catch {
    return ts;
  }
}

// Helper to auto-generate suggested SKU based on name and category
export function generateSuggestedSku(name = '', category = '') {
  const cat = (category.trim().slice(0, 3) || 'PRD').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const nm = (name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 3) || 'ITM').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${cat || 'PRD'}-${nm || 'ITM'}-${rand}`;
}

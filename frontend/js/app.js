/* ==========================================================================
   app.js — shared utilities loaded on every authenticated page
   ========================================================================== */

const SESSION_KEY = 'SESAS_SESSION';

/** Redirect to login if no session exists. Call at top of protected pages. */
function requireAuth() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    window.location.href = 'login.html';
  }
}

function startSession(role, name) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role, name, at: Date.now() }));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function branchColor(branch) {
  const palette = {
    CSE: '#B8863E', ISE: '#3F6E52', ECE: '#A8452E',
    EEE: '#4A587A', ME: '#8C6BAF', CIV: '#2C7A9E', default: '#8A8370'
  };
  return palette[branch] || palette.default;
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(cell => {
    const s = String(cell ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

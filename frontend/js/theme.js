/* theme.js — Dark/light mode toggle with localStorage persistence */

const THEME_KEY = 'SESAS_THEME';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  syncToggleUI(theme);
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function syncToggleUI(theme) {
  const isDark = theme === 'dark';
  document.querySelectorAll('.theme-icon-light').forEach(el => {
    el.style.display = isDark ? 'none' : '';
  });
  document.querySelectorAll('.theme-icon-dark').forEach(el => {
    el.style.display = isDark ? '' : 'none';
  });
  document.querySelectorAll('.theme-label-light').forEach(el => {
    el.style.display = isDark ? 'none' : '';
  });
  document.querySelectorAll('.theme-label-dark').forEach(el => {
    el.style.display = isDark ? '' : 'none';
  });
}

function themeToggleHtml(standalone) {
  const cls = standalone ? 'theme-toggle-standalone' : 'theme-toggle';
  return `
    <button type="button" class="${cls}" onclick="toggleTheme()" aria-label="Toggle dark mode">
      <svg class="theme-icon-dark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="display:none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="theme-icon-light" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      <span class="theme-label-light">Dark Mode</span>
      <span class="theme-label-dark" style="display:none;">Light Mode</span>
    </button>
  `;
}

/* Apply saved theme once body is available */
if (document.body) {
  applyTheme(getTheme());
} else {
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
  });
}

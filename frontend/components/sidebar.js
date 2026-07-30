/* ==========================================================================
   components/sidebar.js
   Renders the left navigation into <div id="sidebar-mount"></div>.
   Set window.ACTIVE_PAGE = 'dashboard' (etc.) before including this script.
   ========================================================================== */

const NAV_ITEMS = [
  { group: 'Overview', items: [
    { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', ico: 'grid' },
  ]},
  { group: 'Setup', items: [
    { id: 'create-exam', href: 'create-exam.html', label: 'Create Exam', ico: 'calendar' },
    { id: 'students', href: 'students.html', label: 'Student Database', ico: 'users' },
    { id: 'classrooms', href: 'classrooms.html', label: 'Classroom Database', ico: 'door' },
    { id: 'seating-rules', href: 'seating-rules.html', label: 'Seating Rules', ico: 'sliders' },
  ]},
  { group: 'Generate', items: [
    { id: 'generate', href: 'generate.html', label: 'Generate Seating', ico: 'shuffle' },
    { id: 'reports', href: 'reports.html', label: 'Reports', ico: 'file' },
    { id: 'analytics', href: 'analytics.html', label: 'Analytics', ico: 'chart' },
  ]},
  { group: 'Public', items: [
    { id: 'student-search', href: 'student-search.html', label: 'Student Search', ico: 'search' },
  ]},
  { group: '', items: [
    { id: 'settings', href: 'settings.html', label: 'Settings', ico: 'cog' },
  ]},
];

const ICONS = {
  grid: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  calendar: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  users: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.3c2.8.4 4.9 2.5 5 5.7"/></svg>',
  door: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>',
  sliders: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h10M18 6h2M4 18h2M10 18h10M4 12h16"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="12" cy="12" r="2"/></svg>',
  shuffle: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h3.5L15 18h6M14.5 6H21M3 18h3.5L11 12"/><path d="M18.5 3.5 21 6l-2.5 2.5M18.5 15.5 21 18l-2.5 2.5"/></svg>',
  file: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M14 2.5V7h4M8 12h8M8 16h8M8 8h3"/></svg>',
  chart: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20h19"/></svg>',
  search: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>',
  cog: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
};

async function renderSidebar() {
  const mount = document.getElementById('sidebar-mount');
  if (!mount) return;
  let college = { name: 'Your College' };
  if (typeof Api !== 'undefined') {
    try { college = await Api.getCollege(); } catch (e) { /* use default */ }
  }
  const active = window.ACTIVE_PAGE || '';

  const groups = NAV_ITEMS.map(g => `
    ${g.group ? `<div class="nav-label">${g.group}</div>` : ''}
    ${g.items.map(it => `
      <a href="${it.href}" class="${it.id === active ? 'active' : ''}">
        ${ICONS[it.ico] || ''}<span>${it.label}</span>
      </a>
    `).join('')}
  `).join('');

  mount.innerHTML = `
    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle menu">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <div class="sidebar-scrim" id="sidebarScrim"></div>
    <aside class="sidebar" id="sidebar">
      <a href="dashboard.html" class="sidebar-brand">
        <span class="mark"><span></span><span></span><span></span><span></span></span>
        <span class="name">SESAS<small>Seat Arrangement System</small></span>
      </a>
      <div class="sidebar-college">
        <strong>${college.name || 'Your College'}</strong>
        ${college.year || ''} · ${college.semester || ''}
      </div>
      <nav class="sidebar-nav">${groups}</nav>
      <div class="sidebar-foot">
        ${typeof themeToggleHtml === 'function' ? themeToggleHtml(false) : ''}
        <div style="margin-top:10px;">
          Signed in as <strong style="color:var(--paper)">${localStorage.getItem('SESAS_USER_NAME') || 'Admin'}</strong><br>
          <a href="index.html" id="logoutLink">Log out</a>
        </div>
      </div>
    </aside>
  `;

  const toggle = document.getElementById('sidebarToggle');
  const scrim = document.getElementById('sidebarScrim');
  const sidebar = document.getElementById('sidebar');
  const open = () => { sidebar.classList.add('open'); scrim.classList.add('open'); };
  const close = () => { sidebar.classList.remove('open'); scrim.classList.remove('open'); };
  if (toggle) toggle.addEventListener('click', open);
  if (scrim) scrim.addEventListener('click', close);

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('SESAS_SESSION');
      localStorage.removeItem('SESAS_TOKEN');
      localStorage.removeItem('SESAS_USER_ROLE');
      localStorage.removeItem('SESAS_USER_NAME');
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', renderSidebar);

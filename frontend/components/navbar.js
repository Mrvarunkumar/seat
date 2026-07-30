/* ==========================================================================
   components/navbar.js
   Renders the sticky topbar into <div id="topbar-mount"></div>.
   Configure per page with:
     window.PAGE_TITLE = 'Dashboard';
     window.PAGE_EYEBROW = 'Overview';
     window.PAGE_ACTIONS = '<a class="btn btn-primary" href="...">Do thing</a>';
   ========================================================================== */

function renderTopbar() {
  const mount = document.getElementById('topbar-mount');
  if (!mount) return;

  const title = window.PAGE_TITLE || 'Dashboard';
  const eyebrow = window.PAGE_EYEBROW || '';
  const actions = window.PAGE_ACTIONS || '';

  const userName = localStorage.getItem('SESAS_USER_NAME') || 'Admin';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  mount.innerHTML = `
    <div class="topbar">
      <div>
        ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}
        <h1>${title}</h1>
      </div>
      <div class="topbar-right">
        ${actions}
        <button class="icon-btn" title="Notifications" aria-label="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
        </button>
        <div class="avatar" title="${userName}">${initials}</div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderTopbar);

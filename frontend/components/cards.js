/* ==========================================================================
   components/cards.js
   Small HTML-string factories used across dashboard/reports/analytics pages.
   ========================================================================== */

/** A stat card with a decorative corner grid (seat-motif), label + value. */
function statCard({ label, value, sub, subClass = '', filledCells = 6 }) {
  const cells = Array.from({ length: 16 }, (_, i) =>
    `<span class="${i < filledCells ? 'filled' : ''}"></span>`
  ).join('');
  return `
    <div class="stat-card fade-up">
      <div class="corner-grid">${cells}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${sub ? `<div class="stat-sub ${subClass}">${sub}</div>` : ''}
    </div>
  `;
}

/** A quick action card linking to another page. */
function quickActionCard({ href, icon, title, desc }) {
  return `
    <a class="qa-card fade-up" href="${href}">
      <div class="qa-ico">${icon}</div>
      <div class="qa-title">${title}</div>
      <div class="qa-desc">${desc}</div>
    </a>
  `;
}

/** A row in the "upcoming exams" list. */
function examRow({ name, date, time, subjectCode }) {
  const d = new Date(date + 'T00:00:00');
  const day = isNaN(d) ? '--' : d.getDate();
  const month = isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' });
  return `
    <div class="exam-row">
      <div class="exam-date"><div class="d">${day}</div><div class="m">${month}</div></div>
      <div class="exam-info">
        <div class="name">${name}</div>
        <div class="meta">${subjectCode || ''} · ${time || ''}</div>
      </div>
      <span class="badge badge-brass">Scheduled</span>
    </div>
  `;
}

/** An activity feed item. */
function activityItem({ text, time }) {
  return `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="a-text">${text}</div>
        <div class="a-time">${time}</div>
      </div>
    </div>
  `;
}

/** Room occupancy mini bar used in dashboard sidebar. */
function roomMiniRow({ room, pct }) {
  return `
    <div class="room-mini-row">
      <div class="rlabel mono">Room ${room}</div>
      <div class="room-mini-bar"><span style="width:${pct}%"></span></div>
      <div class="rpct">${pct}%</div>
    </div>
  `;
}

function emptyState({ title, desc, icon = '', actionHtml = '' }) {
  return `
    <div class="empty-state seat-texture">
      ${icon}
      <div class="em-title">${title}</div>
      <div class="em-desc">${desc}</div>
      ${actionHtml ? `<div class="mt-16">${actionHtml}</div>` : ''}
    </div>
  `;
}

/* ==========================================================================
   components/modal.js
   Minimal modal + toast system. Injects its own root elements once.
   Usage:
     openModal({ title: 'Add Student', bodyHtml: '<div class="field">...</div>',
                 confirmText: 'Save', onConfirm: () => {...} });
     showToast('Saved successfully', 'success');
   ========================================================================== */

function ensureModalRoot() {
  if (document.getElementById('modalRoot')) return;
  const root = document.createElement('div');
  root.id = 'modalRoot';
  root.innerHTML = `
    <div id="modalOverlay" style="display:none;position:fixed;inset:0;background:rgba(27,42,74,0.45);z-index:90;align-items:center;justify-content:center;padding:20px;">
      <div id="modalBox" class="pop-in" style="background:var(--white);border-radius:var(--radius-lg);max-width:480px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:var(--shadow-lg);">
        <div style="padding:22px 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;">
          <h3 id="modalTitle" style="font-size:16px;"></h3>
          <button id="modalClose" class="icon-btn" aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div id="modalBody" style="padding:22px 24px;"></div>
        <div id="modalFoot" style="padding:16px 24px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px;"></div>
      </div>
    </div>
    <div class="toast-stack" id="toastStack"></div>
  `;
  document.body.appendChild(root);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

let _currentConfirmHandler = null;

function openModal({ title, bodyHtml, confirmText = 'Save', cancelText = 'Cancel', onConfirm = null, hideFooter = false }) {
  ensureModalRoot();
  document.getElementById('modalTitle').textContent = title || '';
  document.getElementById('modalBody').innerHTML = bodyHtml || '';
  const foot = document.getElementById('modalFoot');
  foot.style.display = hideFooter ? 'none' : 'flex';
  foot.innerHTML = hideFooter ? '' : `
    <button class="btn btn-outline" id="modalCancelBtn">${cancelText}</button>
    <button class="btn btn-primary" id="modalConfirmBtn">${confirmText}</button>
  `;
  document.getElementById('modalOverlay').style.display = 'flex';

  if (_currentConfirmHandler) {
    document.getElementById('modalConfirmBtn').removeEventListener('click', _currentConfirmHandler);
    _currentConfirmHandler = null;
  }

  if (!hideFooter) {
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    _currentConfirmHandler = async () => {
      if (typeof onConfirm === 'function') {
        const result = await onConfirm();
        if (result !== false) closeModal();
      } else {
        closeModal();
      }
    };
    document.getElementById('modalConfirmBtn').addEventListener('click', _currentConfirmHandler);
  }
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'success', duration = 3200) {
  ensureModalRoot();
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success'
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
  el.innerHTML = `${icon}<span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.25s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

document.addEventListener('DOMContentLoaded', ensureModalRoot);

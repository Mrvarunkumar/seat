/* classroom.js — wires up classrooms.html */

async function renderClassroomTable() {
  const allRooms = await Api.getClassrooms();
  const rooms = allRooms.sort((a, b) => a.room.localeCompare(b.room));
  const tbody = document.getElementById('roomTbody');
  const empty = document.getElementById('roomEmpty');
  const table = document.getElementById('roomTable');

  document.getElementById('roomCount').textContent = `${rooms.length} room${rooms.length === 1 ? '' : 's'}`;
  document.getElementById('totalCapacity').textContent = rooms.reduce((s, r) => s + r.capacity, 0);

  if (!rooms.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  tbody.innerHTML = rooms.map(r => `
    <tr>
      <td class="mono">${escapeHtml(r.room)}</td>
      <td>${r.rows} × ${r.cols}</td>
      <td>${r.capacity}</td>
      <td><span class="badge badge-neutral">${r.benchCapacity} / bench</span></td>
      <td>
        <div class="flex gap-8">
          <button class="icon-btn" data-edit="${r.room}" title="Edit" aria-label="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>
          </button>
          <button class="icon-btn" data-del="${r.room}" title="Delete" aria-label="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditRoom(btn.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm(`Remove Room ${btn.dataset.del}?`)) {
      await Api.deleteClassroom(btn.dataset.del);
      await renderClassroomTable();
      showToast('Room removed', 'success');
    }
  }));
}

function roomFormHtml(room = {}) {
  return `
    <div class="field">
      <label>Room Number</label>
      <input type="text" id="fRoom" value="${escapeHtml(room.room || '')}" placeholder="104" ${room.room ? 'readonly' : ''}>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Rows</label>
        <input type="number" id="fRows" min="1" value="${room.rows || 5}">
      </div>
      <div class="field">
        <label>Columns</label>
        <input type="number" id="fCols" min="1" value="${room.cols || 6}">
      </div>
    </div>
    <div class="field">
      <label>Bench Capacity</label>
      <select id="fBench">
        <option value="1" ${room.benchCapacity === 1 ? 'selected' : ''}>1 student per bench</option>
        <option value="2" ${room.benchCapacity === 2 ? 'selected' : ''}>2 students per bench</option>
      </select>
      <p class="hint">Capacity is calculated automatically as rows × columns.</p>
    </div>
  `;
}

async function openAddRoom() {
  openModal({
    title: 'Add Classroom',
    bodyHtml: roomFormHtml(),
    confirmText: 'Add Room',
    onConfirm: async () => {
      const room = document.getElementById('fRoom').value.trim();
      const rows = parseInt(document.getElementById('fRows').value, 10) || 1;
      const cols = parseInt(document.getElementById('fCols').value, 10) || 1;
      const benchCapacity = parseInt(document.getElementById('fBench').value, 10);
      if (!room) { showToast('Enter a room number', 'error'); return false; }
      const existingRooms = await Api.getClassrooms();
      if (existingRooms.some(r => r.room === room)) { showToast('Room already exists', 'error'); return false; }
      await Api.addClassroom({ room, rows, cols, capacity: rows * cols, benchCapacity });
      await renderClassroomTable();
      showToast('Room added', 'success');
    }
  });
}

async function openEditRoom(roomId) {
  const allRooms = await Api.getClassrooms();
  const room = allRooms.find(r => r.room === roomId);
  if (!room) return;
  openModal({
    title: `Edit Room ${roomId}`,
    bodyHtml: roomFormHtml(room),
    confirmText: 'Save Changes',
    onConfirm: async () => {
      const rows = parseInt(document.getElementById('fRows').value, 10) || 1;
      const cols = parseInt(document.getElementById('fCols').value, 10) || 1;
      const benchCapacity = parseInt(document.getElementById('fBench').value, 10);
      await Api.updateClassroom(roomId, { rows, cols, capacity: rows * cols, benchCapacity });
      await renderClassroomTable();
      showToast('Room updated', 'success');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderClassroomTable();
  document.getElementById('addRoomBtn').addEventListener('click', openAddRoom);
});

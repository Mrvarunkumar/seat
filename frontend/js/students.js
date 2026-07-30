/* students.js — wires up students.html */

let currentFilter = { branch: 'all', query: '' };

async function renderStudentTable() {
  let students = await Api.getStudents();
  const tbody = document.getElementById('studentTbody');
  const empty = document.getElementById('studentEmpty');
  const table = document.getElementById('studentTable');
  const arrangement = await Api.getArrangement();
  const flat = arrangement ? flattenArrangement(arrangement) : [];

  if (currentFilter.branch !== 'all') {
    students = students.filter(s => s.branch === currentFilter.branch);
  }
  if (currentFilter.query) {
    const q = currentFilter.query.toLowerCase();
    students = students.filter(s => s.usn.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }
  students.sort((a, b) => a.usn.localeCompare(b.usn));

  document.getElementById('studentCount').textContent = `${students.length} student${students.length === 1 ? '' : 's'}`;

  if (!students.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  tbody.innerHTML = students.map(s => {
    const seat = flat.find(f => f.usn === s.usn);
    const seatHtml = seat
      ? `<span class="badge badge-brass" style="cursor:pointer" title="${seat.room} — ${seat.seatLabel}" onclick="showSeatPreview('${escapeHtml(s.usn)}')">${escapeHtml(seat.room)} ${seat.seatLabel}</span>`
      : `<span class="text-soft" style="font-size:12px;">—</span>`;
    return `
    <tr>
      <td class="mono">${escapeHtml(s.usn)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td><span class="badge badge-brass">${escapeHtml(s.branch)}</span></td>
      <td>${s.semester}</td>
      <td>${seatHtml}</td>
      <td>
        <div class="flex gap-8">
          <button class="icon-btn" data-edit="${s.usn}" title="Edit" aria-label="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/></svg>
          </button>
          <button class="icon-btn" data-del="${s.usn}" title="Delete" aria-label="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  await populateBranchFilter();

  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditStudent(btn.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm(`Remove ${btn.dataset.del} from the database?`)) {
      await Api.deleteStudent(btn.dataset.del);
      await renderStudentTable();
      showToast('Student removed', 'success');
    }
  }));
}

async function populateBranchFilter() {
  const select = document.getElementById('branchFilter');
  const all = await Api.getStudents();
  const branches = [...new Set(all.map(s => s.branch))].sort();
  const current = select.value || 'all';
  select.innerHTML = `<option value="all">All branches</option>` + branches.map(b => `<option value="${b}">${b}</option>`).join('');
  select.value = current;
}

function studentFormHtml(student = {}) {
  return `
    <div class="field">
      <label>USN</label>
      <input type="text" id="fUsn" value="${escapeHtml(student.usn || '')}" placeholder="1RV21CS001" ${student.usn ? 'readonly' : ''}>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Full Name</label>
        <input type="text" id="fName" value="${escapeHtml(student.name || '')}" placeholder="Student name">
      </div>
      <div class="field">
        <label>Branch</label>
        <input type="text" id="fBranch" value="${escapeHtml(student.branch || '')}" placeholder="CSE">
      </div>
    </div>
    <div class="field">
      <label>Semester</label>
      <input type="number" id="fSemester" min="1" max="8" value="${student.semester || 4}">
    </div>
  `;
}

function openAddStudent() {
  openModal({
    title: 'Add Student',
    bodyHtml: studentFormHtml(),
    confirmText: 'Add Student',
    onConfirm: async () => {
      const usn = document.getElementById('fUsn').value.trim().toUpperCase();
      const name = document.getElementById('fName').value.trim();
      const branch = document.getElementById('fBranch').value.trim().toUpperCase();
      const semester = parseInt(document.getElementById('fSemester').value, 10) || 1;
      if (!usn || !name || !branch) { showToast('Fill in all fields', 'error'); return false; }
      await Api.addStudent({ usn, name, branch, semester });
      await renderStudentTable();
      showToast('Student added', 'success');
    }
  });
}

async function openEditStudent(usn) {
  const allStudents = await Api.getStudents();
  const student = allStudents.find(s => s.usn === usn);
  if (!student) return;
  openModal({
    title: `Edit ${usn}`,
    bodyHtml: studentFormHtml(student),
    confirmText: 'Save Changes',
    onConfirm: async () => {
      const name = document.getElementById('fName').value.trim();
      const branch = document.getElementById('fBranch').value.trim().toUpperCase();
      const semester = parseInt(document.getElementById('fSemester').value, 10) || 1;
      await Api.updateStudent(usn, { name, branch, semester });
      await renderStudentTable();
      showToast('Student updated', 'success');
    }
  });
}

function openUploadModal() {
  openModal({
    title: 'Upload Student List',
    bodyHtml: `
      <p class="text-sm text-soft mb-16">Upload a CSV with columns <strong>usn, name, branch, semester</strong>. (Excel files: export as CSV first — the FastAPI backend will accept .xlsx directly via Pandas.)</p>
      <div class="field">
        <label>CSV File</label>
        <input type="file" id="fCsv" accept=".csv,text/csv">
      </div>
      <div class="field">
        <label>...or paste rows</label>
        <textarea id="fPaste" placeholder="1RV21CS013,Rohit Verma,CSE,4"></textarea>
      </div>
    `,
    confirmText: 'Import',
    onConfirm: async () => {
      const fileInput = document.getElementById('fCsv');
      const pasted = document.getElementById('fPaste').value.trim();
      const finish = async (text) => {
        const rows = parseStudentCSV(text);
        if (!rows.length) { showToast('No valid rows found', 'error'); return; }
        await Api.bulkAddStudents(rows);
        await renderStudentTable();
        showToast(`Imported ${rows.length} students`, 'success');
      };
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async () => await finish(reader.result);
        reader.readAsText(fileInput.files[0]);
        return false;
      } else if (pasted) {
        await finish(pasted);
      } else {
        showToast('Choose a file or paste rows', 'error');
        return false;
      }
    }
  });
}

async function showSeatPreview(usn) {
  const arrangement = await Api.getArrangement();
  if (!arrangement) { showToast('No arrangement generated yet', 'error'); return; }
  const flat = flattenArrangement(arrangement);
  const found = flat.find(f => f.usn === usn);
  if (!found) return;
  const roomData = arrangement.rooms.find(r => r.room === found.room);
  if (!roomData) return;

  const closeBtn = `<button class="btn btn-primary btn-sm" onclick="closeModal()" style="margin:8px auto 0; display:block;">Close</button>`;
  const gridHtml = `
    <div style="display:grid; grid-template-columns: repeat(${roomData.cols}, 1fr); gap:4px; max-width:${Math.min(roomData.cols * 48, 320)}px; margin:16px auto;">
      ${roomData.grid.map((row, r) => row.map((s, c) => {
        const seatLabel = `R${r + 1}C${c + 1}`;
        const isFound = seatLabel === found.seatLabel;
        return s ? `
          <div style="aspect-ratio:1; border-radius:4px; background:${branchColor(s.branch)}; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:7px; color:white; text-align:center; padding:1px; ${isFound ? 'outline:3px solid var(--brass); outline-offset:2px; z-index:1;' : ''}" title="${s.usn} — ${s.name}">
            <div style="font-weight:600; font-size:7px; line-height:1.1;">${s.usn.slice(-4)}</div>
            <div style="font-size:6px; opacity:0.85;">${s.branch}</div>
          </div>
        ` : `<div style="aspect-ratio:1; border-radius:4px; background:var(--line); display:flex; align-items:center; justify-content:center; font-size:7px; color:var(--parchment);">–</div>`;
      }).join('')).join('')}
    </div>
    <p style="text-align:center; font-size:12px; color:var(--ink-soft);">Room ${escapeHtml(roomData.room)} — ${escapeHtml(found.seatLabel)} · Your seat is highlighted</p>
    ${closeBtn}
  `;

  openModal({
    title: `${escapeHtml(found.usn)} — ${escapeHtml(found.name)}`,
    bodyHtml: gridHtml,
    hideFooter: true
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderStudentTable();
  document.getElementById('addStudentBtn').addEventListener('click', openAddStudent);
  document.getElementById('uploadBtn').addEventListener('click', openUploadModal);
  document.getElementById('branchFilter').addEventListener('change', async (e) => { currentFilter.branch = e.target.value; await renderStudentTable(); });
  document.getElementById('studentSearch').addEventListener('input', debounce(async (e) => { currentFilter.query = e.target.value; await renderStudentTable(); }, 200));
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const allStudents = await Api.getStudents();
    const rows = [['USN', 'Name', 'Branch', 'Semester'], ...allStudents.map(s => [s.usn, s.name, s.branch, s.semester])];
    downloadCSV('students.csv', rows);
  });
  document.getElementById('clearAllBtn').addEventListener('click', async () => {
    if (confirm('Remove all students? This cannot be undone.')) {
      await Api.clearStudents();
      await renderStudentTable();
      showToast('Student database cleared', 'success');
    }
  });
});
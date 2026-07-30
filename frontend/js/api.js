/* ==========================================================================
   api.js — Connected to FastAPI backend
   ========================================================================== */

const BASE_URL = 'http://localhost:8000/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('SESAS_TOKEN');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'API Request Failed');
  }
  return response.json();
}

const Api = {
  async login(username, password, role) {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    });
    if (data.token) localStorage.setItem('SESAS_TOKEN', data.token);
    if (data.role) localStorage.setItem('SESAS_USER_ROLE', data.role);
    if (data.name) localStorage.setItem('SESAS_USER_NAME', data.name);
    return data;
  },


  /* ---- College ---- */
  async getCollege() { return await apiFetch('/college'); },
  async saveCollege(college) { return await apiFetch('/college', { method: 'POST', body: JSON.stringify(college) }); },

  /* ---- Students ---- */
  async getStudents() { return await apiFetch('/students'); },
  async addStudent(student) { return await apiFetch('/students', { method: 'POST', body: JSON.stringify(student) }); },
  async bulkAddStudents(list) { return await apiFetch('/students/bulk', { method: 'POST', body: JSON.stringify(list) }); },
  async updateStudent(usn, patch) { return await apiFetch(`/students/${usn}`, { method: 'PUT', body: JSON.stringify(patch) }); },
  async deleteStudent(usn) { return await apiFetch(`/students/${usn}`, { method: 'DELETE' }); },
  async clearStudents() { return await apiFetch('/students', { method: 'DELETE' }); },

  /* ---- Classrooms ---- */
  async getClassrooms() { return await apiFetch('/classrooms'); },
  async addClassroom(room) { return await apiFetch('/classrooms', { method: 'POST', body: JSON.stringify(room) }); },
  async updateClassroom(roomId, patch) { return await apiFetch(`/classrooms/${roomId}`, { method: 'PUT', body: JSON.stringify(patch) }); },
  async deleteClassroom(roomId) { return await apiFetch(`/classrooms/${roomId}`, { method: 'DELETE' }); },

  /* ---- Exams ---- */
  async getExams() { return await apiFetch('/exams'); },
  async addExam(exam) { return await apiFetch('/exams', { method: 'POST', body: JSON.stringify(exam) }); },

  /* ---- Rules ---- */
  async getRules() { return await apiFetch('/rules'); },
  async saveRules(rules) { return await apiFetch('/rules', { method: 'POST', body: JSON.stringify(rules) }); },

  /* ---- Invigilators ---- */
  async getInvigilators() { return await apiFetch('/invigilators'); },

  /* ---- Arrangement result ---- */
  async getArrangement() { return await apiFetch('/arrangement'); },
  async saveArrangement(result) { return await apiFetch('/arrangement', { method: 'POST', body: JSON.stringify(result) }); },

  /* ---- Activity feed ---- */
  async getActivity() { return await apiFetch('/activity'); },

  /* ---- Reset demo data ---- */
  resetDemo() { /* No-op for real backend */ },
};

function parseStudentCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].toLowerCase();
  const startIdx = header.includes('usn') ? 1 : 0;
  const out = [];
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 3) continue;
    const [usn, name, branch, semester] = parts;
    out.push({ usn, name, branch: (branch || '').toUpperCase(), semester: parseInt(semester, 10) || 1 });
  }
  return out;
}

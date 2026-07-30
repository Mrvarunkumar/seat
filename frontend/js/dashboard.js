/* dashboard.js — wires up dashboard.html */

document.addEventListener('DOMContentLoaded', async () => {
  const [students, classrooms, exams, arrangement, activity] = await Promise.all([
    Api.getStudents(),
    Api.getClassrooms(),
    Api.getExams(),
    Api.getArrangement(),
    Api.getActivity()
  ]);

  const totalCapacity = classrooms.reduce((s, r) => s + r.capacity, 0);

  document.getElementById('statCards').innerHTML = [
    statCard({ label: 'Total Students', value: students.length, sub: `${Object.keys(groupByBranch(students)).length} branches`, filledCells: 9 }),
    statCard({ label: 'Total Rooms', value: classrooms.length, sub: `${totalCapacity} seats capacity`, filledCells: 6 }),
    statCard({ label: 'Upcoming Exams', value: exams.length, sub: exams[0] ? formatDate(exams[0].date) + ' next' : 'None scheduled', filledCells: 4 }),
    statCard({
      label: 'Last Arrangement',
      value: arrangement ? `${arrangement.seatedCount}/${arrangement.totalStudents}` : '—',
      sub: arrangement ? (arrangement.violations.length ? `${arrangement.violations.length} exceptions logged` : 'No rule violations') : 'Not generated yet',
      subClass: arrangement ? (arrangement.violations.length ? 'warn' : 'up') : '',
      filledCells: arrangement ? 12 : 1
    }),
  ].join('');

  document.getElementById('quickActions').innerHTML = [
    quickActionCard({ href: 'generate.html', title: 'Generate Seating', desc: 'Run the allocation engine for an exam', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h3.5L15 18h6M14.5 6H21M3 18h3.5L11 12"/></svg>' }),
    quickActionCard({ href: 'student-search.html', title: 'Student Search', desc: 'Look up a seat by USN', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/></svg>' }),
    quickActionCard({ href: 'reports.html', title: 'Reports', desc: 'Download PDF & Excel exports', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M14 2.5V7h4M8 12h8M8 16h8"/></svg>' }),
    quickActionCard({ href: 'create-exam.html', title: 'Create Exam', desc: 'Schedule a new examination', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>' }),
  ].join('');

  const examListEl = document.getElementById('examList');
  if (exams.length) {
    examListEl.innerHTML = exams.map(examRow).join('');
  } else {
    examListEl.innerHTML = emptyState({ title: 'No exams scheduled', desc: 'Create your first examination to begin generating seating.', actionHtml: '<a class="btn btn-primary btn-sm" href="create-exam.html">Create Exam</a>' });
  }

  const roomMiniEl = document.getElementById('roomMini');
  if (classrooms.length) {
    roomMiniEl.innerHTML = classrooms.map(r => {
      const occupied = arrangement ? (arrangement.rooms.find(rm => rm.room === r.room)?.grid.flat().filter(Boolean).length || 0) : 0;
      const pct = r.capacity ? Math.round((occupied / r.capacity) * 100) : 0;
      return roomMiniRow({ room: r.room, pct: arrangement ? pct : 0 });
    }).join('');
  } else {
    roomMiniEl.innerHTML = `<p class="text-sm text-soft">No classrooms added yet.</p>`;
  }

  const activityEl = document.getElementById('activityFeed');
  activityEl.innerHTML = activity.length
    ? activity.map(activityItem).join('')
    : `<p class="text-sm text-soft">No recent activity.</p>`;
});
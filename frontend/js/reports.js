/* reports.js — wires up reports.html */

let activeReportTab = 'room';

async function renderReports() {
  const arrangement = await Api.getArrangement();
  const wrap = document.getElementById('reportContent');
  const noData = document.getElementById('noArrangement');

  if (!arrangement) {
    wrap.style.display = 'none';
    noData.style.display = 'block';
    return;
  }
  wrap.style.display = 'block';
  noData.style.display = 'none';

  if (activeReportTab === 'room') await renderRoomWiseReport(arrangement);
  if (activeReportTab === 'formb') await renderFormBReport(arrangement);
  if (activeReportTab === 'invigilator') await renderInvigilatorReport(arrangement);
}

async function renderRoomWiseReport(arrangement) {
  const college = await Api.getCollege();
  const html = arrangement.rooms.map(room => `
    <div class="panel mb-24">
      <div class="panel-head">
        <div>
          <h3>Room ${escapeHtml(room.room)}</h3>
          <p>${room.rows} rows × ${room.cols} columns · ${room.grid.flat().filter(Boolean).length}/${room.capacity} occupied</p>
        </div>
        <span class="badge badge-brass">${room.benchCapacity} / bench</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Seat</th><th>USN</th><th>Name</th><th>Branch</th></tr></thead>
          <tbody>
            ${room.grid.map((rowArr, r) => rowArr.map((s, c) => s ? `
              <tr>
                <td class="mono">R${r + 1}C${c + 1}</td>
                <td class="mono">${escapeHtml(s.usn)}</td>
                <td>${escapeHtml(s.name)}</td>
                <td><span class="badge badge-brass">${escapeHtml(s.branch)}</span></td>
              </tr>` : '').join('')).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');

  document.getElementById('reportContent').innerHTML = `
    <div class="report-letterhead">
      <h2>${escapeHtml(college.name)}</h2>
      <p class="text-soft text-sm">Room-wise Seating Report · Generated ${new Date(arrangement.generatedAt).toLocaleString('en-IN')}</p>
    </div>
    ${html}
  `;
}

function renderFormBPage(room, exam, college, invigilator, students, roomIndex) {
  const studentCount = students.length;

  const infoRows = [
    ['Branch / Title of the Course', exam ? escapeHtml(exam.name) : '__________', 'Month/Year', college ? escapeHtml(college.year) : '______'],
    ['Subject', exam ? escapeHtml(exam.subjectName || exam.subjectCode) : '__________', 'Semester', college ? escapeHtml(college.semester) : '______'],
    ['Centre', college ? escapeHtml(college.name) : "VTU's CPGS Kalaburagi", 'Sub Code', exam ? escapeHtml(exam.subjectCode) : '______'],
    ['Date', exam ? formatDate(exam.date) : '______', 'Timing', exam ? escapeHtml(exam.time) : '______']
  ];

  const infoTableHTML = infoRows.map(([lk, lv, rk, rv]) =>
    `<tr><td class="fb-info-label">${lk}</td><td class="fb-info-value">${lv}</td><td class="fb-info-label">${rk}</td><td class="fb-info-value">${rv}</td></tr>`
  ).join('');

  const studentRows = [];
  for (let i = 0; i < studentCount; i++) {
    const s = students[i];
    studentRows.push(`<tr>
      <td class="fb-center">${i + 1}</td>
      <td class="mono">${escapeHtml(s.usn)}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>`);
  }

  const blockNo = exam ? escapeHtml(exam.blockNo || '') : '';

  return `
    <div class="form-b-page">
      <div class="fb-header">
        <div class="fb-header-left">
          <img src="assets/image/67333673.jpg" alt="VTU Logo" class="fb-logo" />
        </div>
        <div class="fb-header-center">
          <div class="fb-uni-name">VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI</div>
          <div class="fb-report-title">ATTENDANCE &amp; ROOM SUPERINTENDENT'S / PRACTICAL EXAMINERS' REPORT (In Triplicate)</div>
          <div class="fb-exam-name">B.E./B.Arch./M.B.A./M.C.A./M.Tech./Ph.D./M.Sc.(Res) 4 Semester Examination</div>
        </div>
        <div class="fb-header-right">
          <div class="fb-form-label">FORM - B</div>
          <div class="fb-block-row">
            <span class="fb-block-text">Block No:</span>
            <span class="fb-block-input">${blockNo || '________'}</span>
          </div>
        </div>
      </div>

      <table class="fb-info-table">
        <tbody>${infoTableHTML}</tbody>
      </table>

      <table class="fb-attendance-table">
        <thead>
          <tr>
            <th class="fb-col-sl">Sl.<br>No</th>
            <th class="fb-col-usn">USN</th>
            <th class="fb-col-booklet">Booklet /<br>Drawing Sheet<br>Number</th>
            <th class="fb-col-sig">Signature</th>
            <th class="fb-col-addl">Addl. Booklet /<br>Drawing /<br>Graph Sheet<br>Number</th>
            <th class="fb-col-total">Total</th>
          </tr>
        </thead>
        <tbody>${studentRows.join('')}</tbody>
      </table>

      <div class="fb-absentee-section">
        <div class="fb-absentee-line">
          <span class="fb-absentee-label">USNs (absentees):</span>
          <span class="fb-absentee-dots"></span>
        </div>
        <div class="fb-absentee-line">
          <span class="fb-absentee-label">USNs (Candidates b/u Malpractice):</span>
          <span class="fb-absentee-dots"></span>
        </div>
      </div>

      <div class="fb-signature-section">
        <div class="fb-sig-block">
          <div class="fb-sig-title">Room Superintendent / Examiner-I</div>
          <div class="fb-sig-line">Signature : __________</div>
          <div class="fb-sig-line">Name : __________</div>
          <div class="fb-sig-line">Affiliation : __________</div>
        </div>
        <div class="fb-sig-block">
          <div class="fb-sig-title">Examiner-II</div>
          <div class="fb-sig-line">Signature : __________</div>
          <div class="fb-sig-line">Name : __________</div>
          <div class="fb-sig-line">Affiliation : __________</div>
        </div>
        <div class="fb-sig-block">
          <div class="fb-sig-title">Chief / Deputy Superintendent</div>
          <div class="fb-sig-line">Signature : __________</div>
          <div class="fb-sig-line">Name : __________</div>
          <div class="fb-sig-line">Affiliation : __________</div>
        </div>
      </div>

      <div class="fb-footer">
        <div class="fb-footer-note">NOTE: ANSWER PAPER BUNDLES TO BE SENT TO REGIONAL OFFICE ONLY</div>
        <div class="fb-footer-sub">Separate sheet to be used for each subject. 2 Statement shall be sent to</div>
        <div class="fb-footer-sub">a) Regional center &nbsp; b) Registrar (Evaluation) &nbsp; c) Retained at the college</div>
      </div>
    </div>
  `;
}

async function renderFormBReport(arrangement) {
  const [college, invigilators] = await Promise.all([
    Api.getCollege(),
    Api.getInvigilators()
  ]);
  const exam = arrangement.exam || null;

  const html = arrangement.rooms.map((room, idx) => {
    const students = [];
    for (let r = 0; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        if (room.grid[r][c]) {
          students.push({
            ...room.grid[r][c],
            seatLabel: `R${r + 1}C${c + 1}`,
            seatNumber: r * room.cols + c + 1
          });
        }
      }
    }
    students.sort((a, b) => a.seatNumber - b.seatNumber);

    const inv = invigilators.find(i => i.room === room.room) || { faculty: '', time: '' };

    return renderFormBPage(room, exam, college, inv, students, idx);
  }).join('');

  document.getElementById('reportContent').innerHTML = html;
}

async function renderInvigilatorReport(arrangement) {
  const college = await Api.getCollege();
  const invigilators = await Api.getInvigilators();
  const rows = arrangement.rooms.map(room => {
    const inv = invigilators.find(i => i.room === room.room) || { faculty: 'Unassigned', time: '—' };
    return `
      <tr>
        <td class="mono">${escapeHtml(room.room)}</td>
        <td>${escapeHtml(inv.faculty)}</td>
        <td>${escapeHtml(inv.time)}</td>
        <td>${room.grid.flat().filter(Boolean).length} students</td>
      </tr>`;
  }).join('');

  document.getElementById('reportContent').innerHTML = `
    <div class="report-letterhead">
      <h2>${escapeHtml(college.name)}</h2>
      <p class="text-soft text-sm">Invigilator Assignment Report · Generated ${new Date(arrangement.generatedAt).toLocaleString('en-IN')}</p>
    </div>
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Room</th><th>Faculty</th><th>Duty Time</th><th>Students</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderReports();

  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeReportTab = tab.dataset.tab;
      await renderReports();
    });
  });

  document.getElementById('printBtn').addEventListener('click', () => window.print());

  document.getElementById('exportCsvBtn').addEventListener('click', async () => {
    const arrangement = await Api.getArrangement();
    if (!arrangement) return;

    if (activeReportTab === 'formb') {
      const rows = [['Sl.No', 'USN', 'Room', 'Seat', 'Branch']];
      arrangement.rooms.forEach(room => {
        let sl = 1;
        for (let r = 0; r < room.rows; r++) {
          for (let c = 0; c < room.cols; c++) {
            const s = room.grid[r][c];
            if (s) {
              rows.push([sl++, s.usn, room.room, `R${r+1}C${c+1}`, s.branch]);
            }
          }
        }
      });
      downloadCSV('vtu-form-b-attendance.csv', rows);
    } else if (activeReportTab === 'room') {
      const rows = [['Room', 'Seat', 'USN', 'Name', 'Branch']];
      arrangement.rooms.forEach(room => {
        room.grid.forEach((rowArr, r) => {
          rowArr.forEach((s, c) => {
            if (s) rows.push([room.room, `R${r+1}C${c+1}`, s.usn, s.name, s.branch]);
          });
        });
      });
      downloadCSV('seating-room-wise.csv', rows);
    } else if (activeReportTab === 'invigilator') {
      const invigilators = await Api.getInvigilators();
      const rows = [['Room', 'Faculty', 'Duty Time', 'Students']];
      arrangement.rooms.forEach(room => {
        const inv = invigilators.find(i => i.room === room.room) || { faculty: 'Unassigned', time: '—' };
        rows.push([room.room, inv.faculty, inv.time, room.grid.flat().filter(Boolean).length]);
      });
      downloadCSV('seating-invigilator.csv', rows);
    }
  });
});

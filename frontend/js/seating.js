/* ==========================================================================
   seating.js — the seat allocation engine
   Implements the flow from the product spec:
     1. Group students by branch
     2. Sort each branch queue (by USN, or shuffled if "randomize" is on)
     3. Round-robin across branch queues so no branch dominates the order
     4. Walk every room seat in reading order; before placing, validate
        against left/front neighbours per the enabled rules
     5. If the round-robin candidate conflicts, look ahead through the other
        queues for one that fits; if truly none fit, relax the least
        important rule (front-back) and log a violation rather than stall
     6. Fill rooms in the order given until every student is seated
   Pure functions — no DOM access — so it's easy to unit-test or swap in a
   CSP/backtracking solver later without touching the UI layer.
   ========================================================================== */

function groupByBranch(students) {
  const map = {};
  students.forEach(s => {
    if (!map[s.branch]) map[s.branch] = [];
    map[s.branch].push(s);
  });
  return map;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueues(students, rules) {
  const grouped = groupByBranch(students);
  const branches = Object.keys(grouped).sort();
  const queues = {};
  branches.forEach(b => {
    let list = grouped[b].slice();
    if (rules.randomizeSeats) {
      list = shuffle(list);
    } else {
      list.sort((x, y) => x.usn.localeCompare(y.usn));
    }
    queues[b] = list;
  });
  return { branches, queues };
}

/** Round-robin generator: yields one student per branch in turn, cycling
 *  through branches that still have students left. This is the "no branch
 *  dominates the seating order" step from the spec. */
function makeRoundRobinOrder(branches, queues) {
  const order = [];
  const pointers = {};
  branches.forEach(b => (pointers[b] = 0));
  let remaining = branches.reduce((sum, b) => sum + queues[b].length, 0);
  while (remaining > 0) {
    for (const b of branches) {
      if (pointers[b] < queues[b].length) {
        order.push(queues[b][pointers[b]]);
        pointers[b]++;
        remaining--;
      }
    }
  }
  return order;
}

/** Sequential (USN-ordered) generator: students from all branches sorted
 *  by USN, ignoring the branch queue structure. Used when separateBranches
 *  and alternateBranch are both off. */
function makeSequentialOrder(queues) {
  const all = [];
  Object.values(queues).forEach(q => all.push(...q));
  all.sort((a, b) => a.usn.localeCompare(b.usn));
  return all;
}

/** Checks whether `student` may sit at grid[r][c] given already-placed
 *  neighbours, according to the enabled rules. */
function violatesAdjacency(grid, r, c, student, rules) {
  if (!student) return false;
  const left = c > 0 ? grid[r][c - 1] : null;
  const front = r > 0 ? grid[r - 1][c] : null;

  if (rules.noSameBranchLeftRight && left && left.branch === student.branch) return true;
  if (rules.noSameBranchFrontBack && front && front.branch === student.branch) return true;
  return false;
}

/**
 * Generates a full seating arrangement.
 * @param {Array} students - [{usn, name, branch, semester}]
 * @param {Array} rooms - [{room, rows, cols, capacity, benchCapacity}]
 * @param {Object} rules - seating rule toggles
 * @returns {Object} { rooms: [...], unseated: [...], violations: [...], totalStudents, branchCounts }
 */
function generateSeating(students, rooms, rules) {
  const { branches, queues } = buildQueues(students, rules);
  const branchCounts = {};
  branches.forEach(b => (branchCounts[b] = queues[b].length));

  let pool;
  if (rules.alternateBranch && rules.separateBranches && branches.length > 1) {
    pool = makeRoundRobinOrder(branches, queues);
  } else if (rules.separateBranches) {
    pool = makeRoundRobinOrder(branches, queues);
  } else {
    pool = makeSequentialOrder(queues);
  }

  const violations = [];
  const resultRooms = [];
  let placedCount = 0;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  for (const roomDef of rooms) {
    const rows = roomDef.rows;
    const cols = roomDef.cols;
    const benchCap = roomDef.benchCapacity || 1;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placedCount >= students.length) break;
        if (!pool.length) break;

        // Skip this seat if we're avoiding empty benches and the bench
        // doesn't have enough space for the bench capacity
        if (rules.avoidEmptyBenches && benchCap > 1) {
          const seatsLeftInRow = cols - c;
          if (seatsLeftInRow > 0 && seatsLeftInRow < benchCap) {
            // Partial bench at end of row — leave empty to avoid gap
            break;
          }
        }

        let candidateIdx = -1;
        const singleBranch = branches.length <= 1 || !rules.separateBranches;

        if (singleBranch) {
          candidateIdx = 0;
        } else {
          for (let i = 0; i < pool.length; i++) {
            if (!violatesAdjacency(grid, r, c, pool[i], rules)) {
              candidateIdx = i;
              break;
            }
          }
          if (candidateIdx === -1) {
            const relaxedRules = { ...rules, noSameBranchFrontBack: false };
            for (let i = 0; i < pool.length; i++) {
              if (!violatesAdjacency(grid, r, c, pool[i], relaxedRules)) {
                candidateIdx = i;
                break;
              }
            }
            if (candidateIdx !== -1) {
              violations.push({
                room: roomDef.room, seat: `R${r + 1}C${c + 1}`,
                student: pool[candidateIdx].usn,
                reason: 'Front-back branch rule relaxed — no other candidate fit this seat'
              });
            }
          }
          if (candidateIdx === -1) {
            candidateIdx = 0;
            violations.push({
              room: roomDef.room, seat: `R${r + 1}C${c + 1}`,
              student: pool[0].usn,
              reason: 'Branch adjacency relaxed — insufficient branch diversity for this seat'
            });
          }
        }

        const student = pool.splice(candidateIdx, 1)[0];
        grid[r][c] = student;
        placedCount++;
      }

      // fillRoomCompletely: if the rule is off and we've placed at least one
      // student in this row, we don't skip ahead — we still fill the row.
      // If fillRoomCompletely is off, we allow early room exit once all
      // students are placed (which is already handled above).
    }

    resultRooms.push({ room: roomDef.room, rows, cols, capacity: roomDef.capacity, benchCapacity: benchCap, grid });
    if (rules.fillRoomCompletely) {
      // Continue to next room even if pool is empty — fill remaining rooms
      // as empty grids for reporting completeness
    }
  }

  return {
    rooms: resultRooms,
    unseated: pool,
    violations,
    totalStudents: students.length,
    seatedCount: placedCount,
    totalCapacity,
    branchCounts,
    generatedAt: new Date().toISOString()
  };
}

/** Flattens a generated arrangement into a lookup table by USN for the
 *  student search page and attendance sheets. */
function flattenArrangement(arrangement) {
  const list = [];
  if (!arrangement) return list;
  arrangement.rooms.forEach(room => {
    for (let r = 0; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        const student = room.grid[r][c];
        if (student) {
          list.push({
            ...student,
            room: room.room,
            seatLabel: `R${r + 1}C${c + 1}`,
            seatNumber: r * room.cols + c + 1
          });
        }
      }
    }
  });
  return list;
}

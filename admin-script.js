// ============================================
// ADMIN AUTHENTICATION CHECK
// ============================================
function checkAdminAuth() {
  const isLoggedIn = sessionStorage.getItem('ccs_admin_logged_in');
  if (!isLoggedIn || isLoggedIn !== 'true') {
    window.location.href = 'admin-login.html';
  }
}

function adminLogout() {
  sessionStorage.removeItem('ccs_admin_logged_in');
  sessionStorage.removeItem('ccs_admin_username');
  window.location.href = 'admin-login.html';
}

// Only check auth on admin pages (not student pages that include this script)
try {
  const currentPage = window.location.pathname.split('/').pop() || window.location.pathname.split('\\').pop() || '';
  const adminPages = ['admin.html', 'sit-in-form.html', 'sit-in-record.html', 'sit-in-records.html', 'sit-in-requests.html', 'sit-in-reports.html',
                      'feedback-reports.html', 'reservation.html', 'search-student.html', 'student-list.html', 'announcements.html', 'leaderboards.html'];
  if (adminPages.includes(currentPage)) {
    checkAdminAuth();
  }
} catch (e) {
  console.error('Auth check error:', e);
}

// ============================================
// ADMIN DATABASE MODULE (localStorage)
// ============================================
const AdminDB = {
  USERS_KEY: 'ccs_sitin_users',
  SITIN_KEY: 'ccs_sitin_records',
  ANNOUNCEMENTS_KEY: 'ccs_announcements',
  FEEDBACK_KEY: 'ccs_feedback',
  RESERVATIONS_KEY: 'ccs_reservations',
  SITIN_RESET_KEY: 'ccs_sitin_records_reset_v1',
  STUDENTS_API: 'api/students.php',

  init: function() {
    try {
      if (!localStorage.getItem(this.USERS_KEY)) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(this.SITIN_KEY)) {
        localStorage.setItem(this.SITIN_KEY, JSON.stringify([]));
      }
      if (localStorage.getItem(this.SITIN_RESET_KEY) !== 'true') {
        localStorage.setItem(this.SITIN_KEY, JSON.stringify([]));
        localStorage.setItem(this.SITIN_RESET_KEY, 'true');
      }
      if (!localStorage.getItem(this.ANNOUNCEMENTS_KEY)) {
        localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(this.FEEDBACK_KEY)) {
        localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(this.RESERVATIONS_KEY)) {
        localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error('AdminDB init error:', e);
    }
  },

  requestStudentApiSync: function(method, url, data) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data ? JSON.stringify(data) : null);

      if (xhr.status < 200 || xhr.status >= 300) {
        return null;
      }

      return xhr.responseText ? JSON.parse(xhr.responseText) : null;
    } catch (e) {
      return null;
    }
  },

  saveAllUsers: function(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    const result = this.requestStudentApiSync('POST', this.STUDENTS_API + '?action=bulk', users);
    return result || { success: true, message: 'Students saved locally.' };
  },

  // User operations
  getAllUsers: function() {
    const apiUsers = this.requestStudentApiSync('GET', this.STUDENTS_API);
    if (Array.isArray(apiUsers)) {
      let cachedUsers = [];
      try {
        cachedUsers = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
      } catch (e) {
        cachedUsers = [];
      }

      if (apiUsers.length === 0 && cachedUsers.length > 0) {
        this.requestStudentApiSync('POST', this.STUDENTS_API + '?action=bulk', cachedUsers);
        const migratedUsers = this.requestStudentApiSync('GET', this.STUDENTS_API);
        if (Array.isArray(migratedUsers)) {
          localStorage.setItem(this.USERS_KEY, JSON.stringify(migratedUsers));
          return migratedUsers;
        }
      }

      localStorage.setItem(this.USERS_KEY, JSON.stringify(apiUsers));
      return apiUsers;
    }

    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch (e) {
      console.error('Error parsing users:', e);
      return [];
    }
  },

  getUserById: function(idNumber) {
    const apiUser = this.requestStudentApiSync('GET', this.STUDENTS_API + '?id_number=' + encodeURIComponent(idNumber));
    if (apiUser) {
      return apiUser;
    }

    const users = this.getAllUsers();
    return users.find(user => user.id_number === idNumber);
  },

  addUser: function(userData) {
    const apiResult = this.requestStudentApiSync('POST', this.STUDENTS_API, userData);
    if (apiResult) {
      this.getAllUsers();
      return apiResult.success ? { success: true, message: 'User added successfully!' } : apiResult;
    }

    const users = this.getAllUsers();
    if (this.getUserById(userData.id_number)) {
      return { success: false, message: 'User already exists!' };
    }
    users.push(userData);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'User added successfully!' };
  },

  updateUser: function(idNumber, updatedData) {
    const apiResult = this.requestStudentApiSync('PUT', this.STUDENTS_API + '?id_number=' + encodeURIComponent(idNumber), updatedData);
    if (apiResult) {
      this.getAllUsers();
      return apiResult.success ? { success: true, message: 'User updated successfully!' } : apiResult;
    }

    const users = this.getAllUsers();
    const index = users.findIndex(user => user.id_number === idNumber);
    if (index === -1) {
      return { success: false, message: 'User not found!' };
    }
    users[index] = { ...users[index], ...updatedData };
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'User updated successfully!' };
  },

  deleteUser: function(idNumber) {
    const apiResult = this.requestStudentApiSync('DELETE', this.STUDENTS_API + '?id_number=' + encodeURIComponent(idNumber));
    if (apiResult) {
      this.getAllUsers();
      return apiResult.success ? { success: true, message: 'User deleted successfully!' } : apiResult;
    }

    const users = this.getAllUsers();
    const filtered = users.filter(user => user.id_number !== idNumber);
    if (filtered.length === users.length) {
      return { success: false, message: 'User not found!' };
    }
    localStorage.setItem(this.USERS_KEY, JSON.stringify(filtered));
    return { success: true, message: 'User deleted successfully!' };
  },

  // Sit-in operations
  getAllSitIns: function() {
    try {
      return JSON.parse(localStorage.getItem(this.SITIN_KEY) || '[]');
    } catch (e) {
      console.error('Error parsing sit-ins:', e);
      return [];
    }
  },

  getCurrentSitIns: function() {
    const sitins = this.getAllSitIns();
    return sitins.filter(s => s.status === 'Active');
  },

  getPendingSitInRequests: function() {
    const sitins = this.getAllSitIns();
    return sitins.filter(s => s.status === 'Pending');
  },

  // Recompute and save total_sessions + total_hours onto the student record
  syncStudentTotals: function(studentId) {
    const sitins = this.getAllSitIns();
    const studentSitins = sitins.filter(r => r.student_id === studentId);
    const total_sessions = studentSitins.length;

    const parseTime = t => {
      if (!t || typeof t !== 'string') return null;
      const p = t.split(':').map(Number);
      return p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]) ? p[0] * 60 + p[1] : null;
    };
    const total_hours = Math.round(studentSitins.reduce((sum, r) => {
      const d = Number(r.duration_hours || r.total_hours || r.hours_rendered || 0);
      if (!isNaN(d) && d > 0) return sum + d;
      const s = parseTime(r.start_time), e = parseTime(r.end_time);
      if (s !== null && e !== null && e >= s) return sum + (e - s) / 60;
      return sum + 1;
    }, 0) * 100) / 100;

    this.updateUser(studentId, { total_sessions, total_hours });
  },

  addSitIn: function(sitinData) {
    const sitins = this.getAllSitIns();
    sitinData.id = Date.now().toString();
    sitinData.created_at = new Date().toISOString();
    sitins.push(sitinData);
    localStorage.setItem(this.SITIN_KEY, JSON.stringify(sitins));
    this.syncStudentTotals(sitinData.student_id);
    return { success: true, message: 'Sit-in recorded successfully!' };
  },

  updateSitIn: function(id, updatedData) {
    const sitins = this.getAllSitIns();
    const index = sitins.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Sit-in record not found!' };
    }
    sitins[index] = { ...sitins[index], ...updatedData, updated_at: new Date().toISOString() };
    localStorage.setItem(this.SITIN_KEY, JSON.stringify(sitins));
    this.syncStudentTotals(sitins[index].student_id);
    return { success: true, message: 'Sit-in updated successfully!' };
  },

  approveSitIn: function(id) {
    const sitins = this.getAllSitIns();
    const index = sitins.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Sit-in request not found!' };
    }
    sitins[index].status = 'Active';
    sitins[index].approved_at = new Date().toISOString();
    localStorage.setItem(this.SITIN_KEY, JSON.stringify(sitins));
    return { success: true, message: 'Sit-in request approved!' };
  },

  rejectSitIn: function(id) {
    const sitins = this.getAllSitIns();
    const index = sitins.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, message: 'Sit-in request not found!' };
    }
    sitins[index].status = 'Rejected';
    sitins[index].rejected_at = new Date().toISOString();
    localStorage.setItem(this.SITIN_KEY, JSON.stringify(sitins));
    return { success: true, message: 'Sit-in request rejected.' };
  },

  deleteSitIn: function(id) {
    const sitins = this.getAllSitIns();
    const filtered = sitins.filter(s => s.id !== id);
    if (filtered.length === sitins.length) {
      return { success: false, message: 'Sit-in record not found!' };
    }
    localStorage.setItem(this.SITIN_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Sit-in deleted successfully!' };
  },

  // Announcement operations
  getAllAnnouncements: function() {
    try {
      return JSON.parse(localStorage.getItem(this.ANNOUNCEMENTS_KEY) || '[]');
    } catch (e) {
      console.error('Error parsing announcements:', e);
      return [];
    }
  },

  addAnnouncement: function(text) {
    const announcements = this.getAllAnnouncements();
    const announcement = {
      id: Date.now().toString(),
      text: text,
      author: 'CCS Admin',
      date: new Date().toISOString()
    };
    announcements.unshift(announcement);
    localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    return { success: true, message: 'Announcement posted!' };
  },

  deleteAnnouncement: function(id) {
    const announcements = this.getAllAnnouncements();
    const filtered = announcements.filter(a => a.id !== id);
    localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(filtered));
    return { success: true };
  },

  // Feedback operations
  getAllFeedback: function() {
    try {
      return JSON.parse(localStorage.getItem(this.FEEDBACK_KEY) || '[]');
    } catch (e) {
      console.error('Error parsing feedback:', e);
      return [];
    }
  },

  addFeedback: function(feedbackData) {
    const feedbacks = this.getAllFeedback();
    feedbackData.id = 'FB-' + Date.now();
    feedbackData.created_at = new Date().toISOString();
    feedbacks.push(feedbackData);
    localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(feedbacks));
    return { success: true, message: 'Feedback submitted successfully!' };
  },

  deleteFeedback: function(id) {
    const feedbacks = this.getAllFeedback();
    const filtered = feedbacks.filter(f => f.id !== id);
    if (filtered.length === feedbacks.length) {
      return { success: false, message: 'Feedback not found!' };
    }
    localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Feedback deleted successfully!' };
  },

  // Reservation operations
  getAllReservations: function() {
    try {
      return JSON.parse(localStorage.getItem(this.RESERVATIONS_KEY) || '[]');
    } catch (e) {
      console.error('Error parsing reservations:', e);
      return [];
    }
  },

  addReservation: function(reservationData) {
    const reservations = this.getAllReservations();
    reservations.push(reservationData);
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations));
    return { success: true, message: 'Reservation submitted successfully!' };
  },

  updateReservation: function(id, updatedData) {
    const reservations = this.getAllReservations();
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, message: 'Reservation not found!' };
    }
    reservations[index] = { ...reservations[index], ...updatedData };
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations));
    return { success: true, message: 'Reservation updated successfully!' };
  },

  deleteReservation: function(id) {
    const reservations = this.getAllReservations();
    const filtered = reservations.filter(r => r.id !== id);
    if (filtered.length === reservations.length) {
      return { success: false, message: 'Reservation not found!' };
    }
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Reservation deleted successfully!' };
  },

  // Statistics
  getStatistics: function() {
    const users = this.getAllUsers();
    const sitins = this.getAllSitIns();
    const currentSitins = this.getCurrentSitIns();
    const reservations = this.getAllReservations();
    const pendingReservations = reservations.filter(r => r.status === 'Pending').length;
    const computers = this.getAllComputers();
    const activeComputers = computers.filter(c => c.status === 'Active').length;

    return {
      totalRegistered: users.length,
      currentSitin: currentSitins.length,
      totalSitins: sitins.length,
      pendingReservations: pendingReservations,
      activeComputers: activeComputers
    };
  },

  // Computer operations
  getAllComputers: function() {
    try {
      const computers = JSON.parse(localStorage.getItem('ccs_computers') || '[]');
      // If no computers exist, initialize with default lab computers
      if (computers.length === 0) {
        const defaultComputers = [];
        const labs = ['Lab 524', 'Lab 526', 'Lab 528', 'Lab 530', 'Lab 542', 'Lab 544'];
        let computerId = 1;
        labs.forEach(lab => {
          for (let i = 1; i <= 10; i++) {
            defaultComputers.push({
              id: 'COMP-' + computerId++,
              name: `${lab} - PC ${i}`,
              lab_room: lab,
              status: 'Available', // Available, Active, Maintenance
              software_system: '',
              reserved_by: null,
              reservation_id: null
            });
          }
        });
        localStorage.setItem('ccs_computers', JSON.stringify(defaultComputers));
        return defaultComputers;
      }
      let needsMigration = false;
      const migratedComputers = computers.map(computer => {
        const migratedComputer = { ...computer };
        if (migratedComputer.software_status && !migratedComputer.software_system) {
          delete migratedComputer.software_status;
          migratedComputer.software_system = '';
          needsMigration = true;
        }
        if (typeof migratedComputer.software_system === 'undefined') {
          migratedComputer.software_system = '';
          needsMigration = true;
        }
        return migratedComputer;
      });

      if (needsMigration) {
        localStorage.setItem('ccs_computers', JSON.stringify(migratedComputers));
      }

      return migratedComputers;
    } catch (e) {
      console.error('Error parsing computers:', e);
      return [];
    }
  },

  updateComputer: function(id, updatedData) {
    const computers = this.getAllComputers();
    const index = computers.findIndex(c => c.id === id);
    if (index === -1) {
      return { success: false, message: 'Computer not found!' };
    }
    computers[index] = { ...computers[index], ...updatedData };
    localStorage.setItem('ccs_computers', JSON.stringify(computers));
    return { success: true, message: 'Computer updated successfully!' };
  },

  getComputersByLab: function(labRoom) {
    const computers = this.getAllComputers();
    return computers.filter(c => c.lab_room === labRoom);
  },

  getStudentLeaderboard: function() {
    const users = this.getAllUsers();
    const sitins = this.getAllSitIns();

    const parseTimeToMinutes = function(timeValue) {
      if (!timeValue || typeof timeValue !== 'string') return null;
      const parts = timeValue.split(':').map(Number);
      if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
      return (parts[0] * 60) + parts[1];
    };

    const getRecordHours = function(record) {
      const numericDuration = Number(record.duration_hours || record.total_hours || record.hours_rendered || 0);
      if (!Number.isNaN(numericDuration) && numericDuration > 0) {
        return numericDuration;
      }

      const startMinutes = parseTimeToMinutes(record.start_time);
      const endMinutes = parseTimeToMinutes(record.end_time);
      if (startMinutes !== null && endMinutes !== null && endMinutes >= startMinutes) {
        return (endMinutes - startMinutes) / 60;
      }

      return record.status === 'Completed' ? 1 : 0;
    };

    return users.map(user => {
    const studentSitins = sitins.filter(record => record.student_id === user.id_number);
    const totalSessions = studentSitins.length;
    const totalHours = studentSitins.reduce((sum, record) => sum + getRecordHours(record), 0);

      return {
        student_id: user.id_number,
        student_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id_number,
        course_program: user.course_program || 'N/A',
        year_level: user.course_level || '',
        total_hours: Math.round(totalHours * 100) / 100,
        task_completed: totalSessions,
        completed_sitins: totalSessions
      };
    }).sort((a, b) => {
      if (b.task_completed !== a.task_completed) return b.task_completed - a.task_completed;
      return b.total_hours - a.total_hours;
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
};

AdminDB.init();

// ============================================
// CHART INITIALIZATION
// ============================================
let sitinChart = null;

function initChart() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js is not loaded');
    return;
  }

  const ctx = document.getElementById('sitinChart');
  if (!ctx) return;

  try {
    const stats = AdminDB.getStatistics();
    const users = AdminDB.getAllUsers();

    // Count by course program
    const programCount = {};
    users.forEach(user => {
      const program = user.course_program || 'Unknown';
      programCount[program] = (programCount[program] || 0) + 1;
    });

    const labels = Object.keys(programCount);
    const data = Object.values(programCount);
    const colors = [
      '#0d6efd',
      '#dc3545',
      '#ffc107',
      '#198754',
      '#6f42c1',
      '#fd7e14',
      '#20c997',
      '#e83e8c'
    ];

    if (sitinChart) {
      sitinChart.destroy();
    }

    sitinChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    // Update legend
    const legendContainer = document.getElementById('chartLegend');
    if (legendContainer) {
      legendContainer.innerHTML = labels.map((label, index) => `
        <div class="legend-item">
          <div class="legend-color" style="background: ${colors[index]}"></div>
          <span>${label}: ${data[index]}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Chart initialization error:', e);
  }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================
function updateDashboard() {
  // Only run on admin.html page
  const currentPage = window.location.pathname.split('/').pop() || window.location.pathname.split('\\').pop() || '';
  if (currentPage !== 'admin.html') return;

  try {
    const stats = AdminDB.getStatistics();

    const totalRegisteredEl = document.getElementById('totalRegistered');
    const currentSitinEl = document.getElementById('currentSitin');
    const totalSitinsEl = document.getElementById('totalSitins');
    const pendingReservationsEl = document.getElementById('pendingReservations');
    const activeComputersEl = document.getElementById('activeComputers');

    if (totalRegisteredEl) totalRegisteredEl.textContent = stats.totalRegistered;
    if (currentSitinEl) currentSitinEl.textContent = stats.currentSitin;
    if (totalSitinsEl) totalSitinsEl.textContent = stats.totalSitins;
    if (pendingReservationsEl) pendingReservationsEl.textContent = stats.pendingReservations;
    if (activeComputersEl) activeComputersEl.textContent = stats.activeComputers;

    initChart();
    loadComputerQuickView();
    loadPendingReservationsList();
    loadRecentReservationLogs();
  } catch (e) {
    console.error('Dashboard update error:', e);
  }
}

function loadComputerQuickView() {
  const container = document.getElementById('computerQuickView');
  if (!container) return;

  try {
    const computers = AdminDB.getAllComputers();
    const activeComputers = computers.filter(c => c.status === 'Active');
    const availableComputers = computers.filter(c => c.status === 'Available');

    if (computers.length === 0) {
      container.innerHTML = '<div class="no-data">No computers configured</div>';
      return;
    }

    // Show summary cards
    container.innerHTML = `
      <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${availableComputers.length}</div>
        <div style="font-size: 0.85rem; color: #155724;">Available</div>
      </div>
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #856404;">${activeComputers.length}</div>
        <div style="font-size: 0.85rem; color: #856404;">In Use</div>
      </div>
      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #721c24;">${computers.filter(c => c.status === 'Maintenance').length}</div>
        <div style="font-size: 0.85rem; color: #721c24;">Maintenance</div>
      </div>
      <div style="background: #e9ecef; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #495057;">${computers.length}</div>
        <div style="font-size: 0.85rem; color: #495057;">Total</div>
      </div>
    `;
  } catch (e) {
    console.error('Load computer quick view error:', e);
  }
}

function loadPendingReservationsList() {
  const container = document.getElementById('pendingReservationsList');
  if (!container) return;

  try {
    const reservations = AdminDB.getAllReservations();
    const pendingReservations = reservations.filter(r => r.status === 'Pending').slice(0, 5);

    if (pendingReservations.length === 0) {
      container.innerHTML = '<div class="no-data">No pending reservations</div>';
      return;
    }

    container.innerHTML = pendingReservations.map(resv => {
      const date = formatDate(resv.date);
      return `
        <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong>${resv.student_name}</strong>
            <span style="color: #ffc107; font-size: 0.75rem;">Pending</span>
          </div>
          <div style="font-size: 0.8rem; color: #666;">
            ${resv.lab_room} | ${date} | ${resv.start_time} - ${resv.end_time}
          </div>
          <div style="font-size: 0.8rem; color: #555; margin-top: 5px;">
            ${resv.purpose}
          </div>
          <div style="display: flex; gap: 5px; margin-top: 8px;">
            <button class="btn-submit" style="padding: 3px 8px; font-size: 0.7rem;" onclick="quickUpdateReservation('${resv.id}', 'Approved')">✓</button>
            <button class="btn-danger" style="padding: 3px 8px; font-size: 0.7rem;" onclick="quickUpdateReservation('${resv.id}', 'Rejected')">✗</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Load pending reservations error:', e);
  }
}

function quickUpdateReservation(id, status) {
  const result = AdminDB.updateReservation(id, { status: status });
  if (result.success) {
    alert(`Reservation ${status.toLowerCase()}!`);
    updateDashboard();
  } else {
    alert('Error: ' + result.message);
  }
}

function loadRecentReservationLogs() {
  const tbody = document.getElementById('recentLogsBody');
  if (!tbody) return;

  try {
    const reservations = AdminDB.getAllReservations();
    // Sort by created_at (newest first) and take last 10
    const recentLogs = reservations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    if (recentLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-data">No reservation logs</td></tr>';
      return;
    }

    tbody.innerHTML = recentLogs.map(resv => {
      const date = formatDate(resv.date);
      let statusColor = '#ffc107';
      if (resv.status === 'Approved') statusColor = '#198754';
      if (resv.status === 'Rejected') statusColor = '#dc3545';
      if (resv.status === 'Completed') statusColor = '#6c757d';

      return `
        <tr>
          <td>${resv.id}</td>
          <td>${resv.student_name}</td>
          <td>${resv.lab_room}</td>
          <td>${date} | ${resv.start_time}</td>
          <td><span style="color: ${statusColor}; font-weight: 500;">${resv.status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error('Load recent logs error:', e);
  }
}

function loadAnnouncements() {
  // Only run on admin.html page
  const currentPage = window.location.pathname.split('/').pop() || window.location.pathname.split('\\').pop() || '';
  if (currentPage !== 'admin.html') return;

  const announcementsList = document.getElementById('announcementList');
  if (!announcementsList) return;

  try {
    const announcements = AdminDB.getAllAnnouncements();

    if (announcements.length === 0) {
      announcementsList.innerHTML = '<div class="no-data">No announcements yet</div>';
      return;
    }

    announcementsList.innerHTML = announcements.map(ann => {
      const date = new Date(ann.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `
        <div class="announcement-item">
          <div class="announcement-meta">
            <strong>${ann.author}</strong> | ${date}
          </div>
          <div class="announcement-text">${ann.text}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Load announcements error:', e);
  }
}

function postAnnouncement() {
  const textarea = document.getElementById('announcementText');
  if (!textarea) return;

  try {
    const text = textarea.value.trim();
    if (!text) {
      alert('Please enter an announcement text.');
      return;
    }

    const result = AdminDB.addAnnouncement(text);
    if (result.success) {
      textarea.value = '';
      loadAnnouncements();
      alert('Announcement posted successfully!');
    }
  } catch (e) {
    console.error('Post announcement error:', e);
    alert('Error posting announcement.');
  }
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

function searchStudent() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  try {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      alert('Please enter a search query.');
      return;
    }

    const users = AdminDB.getAllUsers();
    const results = users.filter(user =>
      user.id_number.toLowerCase().includes(query) ||
      (user.first_name + ' ' + user.last_name).toLowerCase().includes(query)
    );

    if (results.length === 0) {
      alert('No students found matching your search.');
    } else {
      let message = `Found ${results.length} student(s):\n\n`;
      results.forEach(r => {
        message += `${r.first_name} ${r.last_name} (${r.id_number}) - ${r.course_program}\n`;
      });
      alert(message);
    }
  } catch (e) {
    console.error('Search error:', e);
    alert('Error performing search.');
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

function getLevelText(level) {
  const levels = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
  return levels[level] || level;
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  try {
    updateDashboard();
    loadAnnouncements();
  } catch (e) {
    console.error('DOM initialization error:', e);
  }
});

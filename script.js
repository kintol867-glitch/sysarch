// ============================================
// LOCAL DATABASE MODULE (localStorage)
// ============================================
const LocalDB = {
  DB_NAME: 'ccs_sitin_users',
  SESSION_KEY: 'ccs_sitin_current_user',
  STUDENTS_API: 'api/students.php',

  init: function() {
    if (!localStorage.getItem(this.DB_NAME)) {
      localStorage.setItem(this.DB_NAME, JSON.stringify([]));
    }
  },

  getAllUsers: function() {
    return JSON.parse(localStorage.getItem(this.DB_NAME) || '[]');
  },

  syncStudentsFromApi: async function() {
    const cachedUsers = this.getAllUsers();
    const response = await fetch(this.STUDENTS_API, { cache: 'no-store' });
    if (!response.ok) throw new Error('Students API unavailable');
    let users = await response.json();

    if (Array.isArray(users) && users.length === 0 && cachedUsers.length > 0) {
      await fetch(this.STUDENTS_API + '?action=bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedUsers)
      });
      const migratedResponse = await fetch(this.STUDENTS_API, { cache: 'no-store' });
      if (migratedResponse.ok) {
        users = await migratedResponse.json();
      }
    }

    localStorage.setItem(this.DB_NAME, JSON.stringify(users));
    return users;
  },

  findUser: function(idNumber) {
    const users = this.getAllUsers();
    return users.find(user => user.id_number === idNumber);
  },

  registerLocal: function(userData) {
    const users = this.getAllUsers();
    
    if (this.findUser(userData.id_number)) {
      return { success: false, message: 'User with this ID number already exists!' };
    }

    users.push(userData);
    localStorage.setItem(this.DB_NAME, JSON.stringify(users));
    return { success: true, message: 'Registration successful! Please login.' };
  },

  register: async function(userData) {
    try {
      const response = await fetch(this.STUDENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const result = await response.json();

      if (result.success) {
        await this.syncStudentsFromApi();
      }

      return result;
    } catch (e) {
      return this.registerLocal(userData);
    }
  },

  loginLocal: function(idNumber, password) {
    const user = this.findUser(idNumber);

    if (!user) {
      return { success: false, message: 'User not found. Please register first.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please try again.' };
    }

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    return { success: true, message: 'Login successful! Welcome, ' + user.first_name + '!', user: user };
  },

  login: async function(idNumber, password) {
    try {
      const response = await fetch(this.STUDENTS_API + '?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: idNumber, password: password })
      });
      const result = await response.json();

      if (result.success && result.user) {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(result.user));
        await this.syncStudentsFromApi();
      }

      return result;
    } catch (e) {
      return this.loginLocal(idNumber, password);
    }
  },

  getCurrentUser: function() {
    const userData = sessionStorage.getItem(this.SESSION_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  logout: function() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'index.html';
  },

  isLoggedIn: function() {
    return this.getCurrentUser() !== null;
  },

  updateUserLocal: function(idNumber, updatedData) {
    const users = this.getAllUsers();
    const index = users.findIndex(user => user.id_number === idNumber);

    if (index === -1) {
      return { success: false, message: 'User not found!' };
    }

    users[index] = { ...users[index], ...updatedData };
    localStorage.setItem(this.DB_NAME, JSON.stringify(users));
    return { success: true, message: 'Profile updated successfully!' };
  },

  updateUser: async function(idNumber, updatedData) {
    try {
      const response = await fetch(this.STUDENTS_API + '?id_number=' + encodeURIComponent(idNumber), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const result = await response.json();

      if (result.success) {
        await this.syncStudentsFromApi();
      }

      return result;
    } catch (e) {
      return this.updateUserLocal(idNumber, updatedData);
    }
  },

  // Redirect to student dashboard if logged in
  redirectToDashboard: function() {
    if (this.isLoggedIn()) {
      window.location.href = 'student-dashboard.html';
    }
  }
};

LocalDB.init();

// ============================================
// USER BUBBLE COMPONENT
// ============================================
const UserBubble = {
  render: function(navLinksContainer) {
    if (!navLinksContainer) return;

    const user = LocalDB.getCurrentUser();

    // Remove existing bubble if any
    const existingBubble = navLinksContainer.querySelector('.user-bubble-container');
    if (existingBubble) existingBubble.remove();

    // Get login, register, and reservation links
    const loginLink = navLinksContainer.querySelector('a[href="login.html"]');
    const registerLink = navLinksContainer.querySelector('a[href="register.html"]');
    const reservationLink = navLinksContainer.querySelector('a[href="student-reservation.html"]');

    if (user) {
      // Hide login and register links when logged in
      if (loginLink) loginLink.style.display = 'none';
      if (registerLink) registerLink.style.display = 'none';

      // Show reservation link for logged-in users
      if (reservationLink) reservationLink.style.display = '';

      // Profile picture HTML
      const profilePicHTML = user.profile_picture 
        ? `<img src="${user.profile_picture}" alt="Profile" class="user-avatar-img">`
        : `<span class="user-avatar">${user.first_name.charAt(0).toUpperCase()}</span>`;

      const bubbleHTML = `
        <div class="user-bubble-container">
          <div class="user-bubble" onclick="UserBubble.toggleDropdown()">
            ${profilePicHTML}
            <span class="user-name">${user.first_name}</span>
            <span class="dropdown-arrow">▼</span>
          </div>
          <div class="user-dropdown" id="userDropdown">
            <div class="dropdown-header">
              <strong>${user.first_name} ${user.last_name}</strong>
              <span>${user.id_number}</span>
            </div>
            <div class="dropdown-info">
              <span>${user.course_program} - ${this.getLevelText(user.course_level)} Year</span>
            </div>
            <a href="student-dashboard.html" class="dropdown-item">Dashboard</a>
            <a href="student-reservation.html" class="dropdown-item">Reservation</a>
            <button onclick="LocalDB.logout()" class="dropdown-item logout-btn">
              Logout
            </button>
          </div>
        </div>
      `;

      navLinksContainer.insertAdjacentHTML('beforeend', bubbleHTML);
    } else {
      // Show login and register links when not logged in
      if (loginLink) loginLink.style.display = '';
      if (registerLink) registerLink.style.display = '';
      // Hide reservation link for non-logged-in users
      if (reservationLink) reservationLink.style.display = 'none';
    }
  },

  toggleDropdown: function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },

  getLevelText: function(level) {
    const levels = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
    return levels[level] || level;
  }
};

document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-bubble-container')) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
});

// ============================================
// PAGE AUTH HANDLER
// ============================================
const PageAuth = {
  checkAuth: function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isLoggedIn = LocalDB.isLoggedIn();

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      UserBubble.render(navLinks);
    }

    // Redirect logged-in users away from login/register pages
    if ((currentPage === 'login.html' || currentPage === 'register.html') && isLoggedIn) {
      window.location.href = 'student-dashboard.html';
      return;
    }

    if (currentPage === 'index.html' && isLoggedIn) {
      const user = LocalDB.getCurrentUser();
      this.showWelcomeBack(user);
    }
  },

  showWelcomeBack: function(user) {
    const welcomeSection = document.querySelector('.welcome-section h1');
    if (welcomeSection) {
      welcomeSection.textContent = `Welcome back, ${user.first_name}!`;
    }
  }
};

// ============================================
// LOGIN FORM HANDLER
// ============================================
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('login_message');

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const idNumber = document.getElementById('login_id').value.trim();
      const password = document.getElementById('login_password').value;

      clearMessage();

      if (!idNumber || !password) {
        showMessage('Please enter both ID Number and Password.', 'error');
        return;
      }

      const result = await LocalDB.login(idNumber, password);

      if (result.success) {
        showMessage(result.message + ' Redirecting...', 'success');

        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
          UserBubble.render(navLinks);
        }

        setTimeout(function() {
          window.location.href = 'student-dashboard.html';
        }, 1500);
      } else {
        showMessage(result.message, 'error');
      }
    });
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'form-message ' + type;
    messageDiv.style.display = 'block';
  }

  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = 'form-message';
    messageDiv.style.display = 'none';
  }
}

// ============================================
// REGISTER FORM HANDLER
// ============================================
function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  const messageDiv = document.getElementById('register_message');

  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const idNumber = document.getElementById('reg_id').value.trim();
      const lastName = document.getElementById('reg_last').value.trim();
      const firstName = document.getElementById('reg_first').value.trim();
      const middleName = document.getElementById('reg_middle').value.trim();
      const email = document.getElementById('reg_email').value.trim();
      const courseProgram = document.getElementById('reg_course_program').value;
      const courseLevel = document.getElementById('reg_course_level').value;
      const password = document.getElementById('reg_password').value;
      const repeatPassword = document.getElementById('reg_repeat_password').value;
      const address = document.getElementById('reg_address').value.trim();

      clearMessage();

      if (!idNumber || !firstName || !lastName || !email || !courseProgram || !courseLevel || !password) {
        showMessage('Please fill in all required fields.', 'error');
        return;
      }

      if (!/^\d+$/.test(idNumber)) {
        showMessage('ID Number should contain only numbers.', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
      }

      if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
      }

      if (password !== repeatPassword) {
        showMessage('Passwords do not match! Please try again.', 'error');
        return;
      }

      const userData = {
        id_number: idNumber,
        last_name: lastName,
        first_name: firstName,
        middle_name: middleName,
        email: email,
        course_program: courseProgram,
        course_level: courseLevel,
        password: password,
        address: address,
        remaining_session: 30,
        created_at: new Date().toISOString()
      };

      const result = await LocalDB.register(userData);

      if (result.success) {
        showMessage(result.message + ' Redirecting to login...', 'success');
        setTimeout(function() {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        showMessage(result.message, 'error');
      }
    });
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'form-message ' + type;
    messageDiv.style.display = 'block';
  }

  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.className = 'form-message';
    messageDiv.style.display = 'none';
  }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  PageAuth.checkAuth();
  initLoginForm();
  initRegisterForm();
});

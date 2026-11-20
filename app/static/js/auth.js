let currentAuthMode = 'login';
let postAuthAction = null;

// Opens the Authentication Modal safely, closing mobile offcanvas first if open
function openAuthModal(mode = 'login', callback = null) {
  postAuthAction = callback;
  currentAuthMode = mode;

  const modalEl = document.getElementById('authModal');
  if (!modalEl) {
    console.error("Auth modal element not found.");
    return;
  }

  // 1. If mobile drawer is open, dismiss it first to prevent backdrop conflicts
  const drawerEl = document.getElementById('mobileNavDrawer');
  if (drawerEl && drawerEl.classList.contains('show')) {
    const drawerInstance = bootstrap.Offcanvas.getInstance(drawerEl);
    if (drawerInstance) {
      drawerInstance.hide();
      
      // Wait for drawer to finish closing before presenting modal
      drawerEl.addEventListener('hidden.bs.offcanvas', function onDrawerClosed() {
        drawerEl.removeEventListener('hidden.bs.offcanvas', onDrawerClosed);
        showAuthModalInstance(modalEl, mode);
      });
      return;
    }
  }

  showAuthModalInstance(modalEl, mode);
}

function showAuthModalInstance(modalEl, mode) {
  // Update segment tab UI
  if (typeof switchAuthTab === 'function') {
    switchAuthTab(mode);
  }

  // Clear any existing error state
  const errBox = document.getElementById('auth-error-alert');
  if (errBox) errBox.classList.add('d-none');

  // Trigger modal
  const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  modalInstance.show();
}

// Closes the Authentication Modal
function closeAuthModal() {
  const modalEl = document.getElementById('authModal');
  if (!modalEl) return;
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
}

// Renders the Desktop Navbar & Mobile Drawer Auth Status
function renderNavAuth() {
  const user = (typeof API !== 'undefined' && API.getUser) ? API.getUser() : null;
  const desktopSlot = document.getElementById('nav-auth-slot');
  const drawerSlot = document.getElementById('drawer-auth-slot');

  if (user) {
    // 1. Desktop Nav (Logged In)
    if (desktopSlot) {
      desktopSlot.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="/my-bookings" class="btn btn-outline-light rounded-pill btn-sm px-3 fw-semibold text-white">My Bookings</a>
          <span class="text-white fw-bold small px-2">${user.full_name.split(' ')[0]}</span>
          <button id="btn-do-logout-desktop" class="btn btn-light rounded-pill btn-sm px-3 fw-bold text-valam-blue shadow-sm">Log Out</button>
        </div>
      `;
      document.getElementById('btn-do-logout-desktop').addEventListener('click', handleLogout);
    }

    // 2. Mobile Drawer (Logged In)
    if (drawerSlot) {
      drawerSlot.innerHTML = `
        <div class="bg-white rounded-3 p-3 mb-3 text-dark shadow-sm">
          <small class="text-muted d-block tiny fw-bold text-uppercase">Logged In</small>
          <b class="fs-6 text-valam-blue">${user.full_name}</b>
        </div>
        <a href="/my-bookings" class="btn btn-light text-valam-blue w-100 rounded-pill py-2 fw-bold mb-2 shadow-sm d-flex align-items-center justify-content-center gap-2" onclick="closeMobileNav()">
          <i class="bi bi-calendar-check-fill"></i> My Bookings
        </a>
        <button id="btn-do-logout-drawer" class="btn btn-outline-light w-100 rounded-pill py-2 fw-bold">
          Log Out
        </button>
      `;
      document.getElementById('btn-do-logout-drawer').addEventListener('click', handleLogout);
    }
  } else {
    // 1. Desktop Nav (Logged Out)
    if (desktopSlot) {
      desktopSlot.innerHTML = `
        <button type="button" class="btn btn-pill-trans" onclick="openAuthModal('login')">
          Sign In
        </button>
        <button type="button" class="btn btn-pill-white" onclick="openAuthModal('register')">
          Sign In &nearr;
        </button>
      `;
    }

    // 2. Mobile Drawer (Logged Out)
    if (drawerSlot) {
      drawerSlot.innerHTML = `
        <button type="button" class="btn btn-light text-valam-blue w-100 rounded-pill py-2 fw-bold mb-2 shadow-sm" onclick="openAuthModal('login')">
          Sign In
        </button>
        <button type="button" class="btn btn-outline-light w-100 rounded-pill py-2 fw-bold" onclick="openAuthModal('register')">
          Create Account
        </button>
      `;
    }
  }
}

function handleLogout() {
  if (typeof API !== 'undefined' && API.clearAuth) {
    API.clearAuth();
  }
  if (typeof showToast === 'function') {
    showToast("Signed out successfully", "info");
  }
  setTimeout(() => {
    window.location.reload();
  }, 400);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavAuth();

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('auth-email');
      const passwordInput = document.getElementById('auth-password');
      const errBox = document.getElementById('auth-error-alert');
      const errMsg = document.getElementById('auth-error-msg');
      const btnSpinner = document.getElementById('auth-btn-spinner');
      const submitBtn = document.getElementById('auth-submit-btn');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (errBox) errBox.classList.add('d-none');

      if (!email || !password) {
        if (errBox && errMsg) {
          errMsg.innerText = "Please fill in all required fields.";
          errBox.classList.remove('d-none');
        }
        return;
      }

      if (btnSpinner) btnSpinner.classList.remove('d-none');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (currentAuthMode === 'login') {
          const res = await API.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });

          API.setAuth(res.token, res.user);

          if (res.user.role === 'admin') {
            window.location.href = '/admin';
            return;
          }
        } else {
          const fullName = document.getElementById('auth-fullname')?.value.trim() || '';
          const phone = document.getElementById('auth-phone')?.value.trim() || '';

          if (!fullName || !phone) {
            throw new Error("Please provide your full legal name and phone number.");
          }

          const res = await API.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ full_name: fullName, email, phone, password })
          });

          API.setAuth(res.token, res.user);
        }

        closeAuthModal();
        renderNavAuth();

        if (typeof showToast === 'function') {
          showToast(currentAuthMode === 'login' ? "Welcome back!" : "Account created successfully!", "success");
        }

        if (postAuthAction) {
          postAuthAction();
          postAuthAction = null;
        } else {
          setTimeout(() => window.location.reload(), 400);
        }

      } catch (err) {
        if (errBox && errMsg) {
          errMsg.innerText = err.message || "Authentication failed. Please verify your details.";
          errBox.classList.remove('d-none');
        } else {
          alert(err.message);
        }
      } finally {
        if (btnSpinner) btnSpinner.classList.add('d-none');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
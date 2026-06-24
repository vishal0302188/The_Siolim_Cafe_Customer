/* 
  The Siolim Café - Shared Client Logic
  Handles: Scroll header adjustments, Mobile menu, Scroll-synced plant animation,
           Menu tabs filter, Review slide carousel, LocalStorage Bookings & WhatsApp integrations.
*/

// Immediately apply theme from localStorage to prevent flash of light mode (FOUC)
const currentSavedTheme = localStorage.getItem('siolim_theme') || 'light';
if (currentSavedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ==========================================================================
// FIREBASE CLOUD DATABASE CONFIGURATION
// ==========================================================================
// Replace this placeholder configuration with your actual Firebase project web app credentials
// from the Firebase Console (Gear Icon -> Project Settings -> General -> Your Apps)
const firebaseConfig = {
  apiKey: "AIzaSyAUOxVOCrMvb5vh1UUFBembLx328DDSA6Y",
  authDomain: "the-siolim-cafe.firebaseapp.com",
  projectId: "the-siolim-cafe",
  storageBucket: "the-siolim-cafe.firebasestorage.app",
  messagingSenderId: "364097118265",
  appId: "1:364097118265:web:537eb1c479344b362ede8",
  measurementId: "G-NJ9ZH4ZVBY"
};

// Initialize Firebase if credentials are set, otherwise fall back to LocalStorage
let db = null;
let useFirebase = false;

if (typeof firebase !== 'undefined') {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    useFirebase = true;
    
    // Set Auth persistence to SESSION if the Auth library is loaded (logs out when tab/browser is closed)
    if (typeof firebase.auth === 'function') {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .catch((err) => {
          console.error("Firebase Auth persistence error:", err);
        });
    }

    console.log("Firebase Cloud Database successfully initialized!");
  } else {
    console.warn("Firebase configuration placeholders detected. Defaulting to LocalStorage fallback mode. Paste your Firebase Web Config in script.js to activate the real cloud database.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 0. PREMIUM DARK MODE TOGGLE LOGIC
  // ==========================================
  const themeToggleBtns = document.querySelectorAll('#theme-toggle');
  
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Toggle theme click handlers
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      localStorage.setItem('siolim_theme', newTheme);
      applyTheme(newTheme);
    });
  });
  
  // Update Database Connection Status Badge if present
  const dbStatusBadge = document.getElementById('db-status-badge');
  if (dbStatusBadge) {
    if (useFirebase) {
      dbStatusBadge.innerHTML = '<i class="fa-solid fa-cloud"></i> Firebase Cloud';
      dbStatusBadge.style.backgroundColor = 'var(--color-teal)';
    } else {
      dbStatusBadge.innerHTML = '<i class="fa-solid fa-database"></i> Local Storage';
      dbStatusBadge.style.backgroundColor = 'var(--color-wood-brown)';
    }
  }
  
  // ==========================================
  // 1. SHARED LOGIC (Header & Mobile Menu)
  // ==========================================
  const header = document.getElementById('main-header');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  
  // Header shrink on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu drawer toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.querySelector('i').className = 'fa-solid fa-bars';
      });
    });
  }

  // ==========================================
  // 2. SCROLL-SYNCED PLANT ANIMATION (Customer Site)
  // ==========================================
  const leftTop = document.querySelector('.plant-left-top');
  const rightMiddle = document.querySelector('.plant-right-middle');
  const leftMiddle = document.querySelector('.plant-left-middle');
  const rightBottom = document.querySelector('.plant-right-bottom');
  const leftBottom = document.querySelector('.plant-left-bottom');

  if (leftTop || rightMiddle || leftMiddle || rightBottom || leftBottom) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      
      // Top Left Monstera: slides further left & rotates clockwise
      if (leftTop) {
        leftTop.style.transform = `translate3d(${scrolled * -0.12}px, ${scrolled * 0.08}px, 0) rotate(${scrolled * 0.04}deg)`;
      }
      
      // Right Middle Palm: pulls left/inward & rotates counter-clockwise
      if (rightMiddle) {
        rightMiddle.style.transform = `translate3d(${scrolled * 0.08}px, ${scrolled * -0.1}px, 0) rotate(${scrolled * -0.03}deg)`;
      }
      
      // Left Middle Vine: swings gently outwards
      if (leftMiddle) {
        leftMiddle.style.transform = `translate3d(${scrolled * -0.06}px, ${scrolled * 0.05}px, 0) rotate(${scrolled * 0.02}deg)`;
      }
      
      // Right Bottom Fern: slides out of view and pivots slightly
      if (rightBottom) {
        rightBottom.style.transform = `translate3d(${scrolled * 0.1}px, ${scrolled * -0.06}px, 0) rotate(${scrolled * 0.03}deg)`;
      }
      
      // Left Bottom Tropical leaf: rotates slightly
      if (leftBottom) {
        leftBottom.style.transform = `translate3d(${scrolled * -0.05}px, ${scrolled * 0.08}px, 0) rotate(${scrolled * -0.02}deg)`;
      }
    });
  }

  // ==========================================
  // 3. MENU TAB FILTER (Customer Site)
  // ==========================================
  const tabBtns = document.querySelectorAll('.menu-tab-btn');
  const menuGrid = document.getElementById('menu-grid-container');

  if (tabBtns.length > 0 && menuGrid) {
    const cards = menuGrid.querySelectorAll('.menu-item-card');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active button class
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');

        cards.forEach(card => {
          const cardCategory = card.getAttribute('data-category');
          
          if (category === 'all' || cardCategory === category) {
            // Re-show card with a quick animation
            card.style.display = 'flex';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95) translateY(10px)';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1) translateY(0)';
              card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            }, 50);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ==========================================
  // 4. REVIEWS CAROUSEL SLIDER (Customer Site)
  // ==========================================
  const prevBtn = document.getElementById('prev-review');
  const nextBtn = document.getElementById('next-review');
  const slides = document.querySelectorAll('.review-slide');
  let currentSlide = 0;

  if (slides.length > 0) {
    function showSlide(index) {
      slides.forEach(slide => {
        slide.classList.remove('active');
        slide.style.opacity = '0';
      });
      
      // Boundary check
      if (index >= slides.length) currentSlide = 0;
      else if (index < 0) currentSlide = slides.length - 1;
      else currentSlide = index;
      
      slides[currentSlide].classList.add('active');
      // Adding a small delay for opacity to let display transition smooth
      setTimeout(() => {
        slides[currentSlide].style.opacity = '1';
      }, 50);
    }

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
      });
      
      nextBtn.addEventListener('click', () => {
        showSlide(currentSlide + 1);
      });
    }

    // Auto rotate every 8 seconds
    setInterval(() => {
      showSlide(currentSlide + 1);
    }, 8000);
  }

  // ==========================================
  // 5. BOOKING LOGIC (LocalStorage Database)
  // ==========================================
  
  // Seed initial mock data if LocalStorage is totally empty, and migrate old numbers
  function initMockBookings() {
    let existing = localStorage.getItem('siolim_bookings');
    if (existing) {
      // Migrate old mock phone numbers to the user's number so testing works immediately
      let bookings = JSON.parse(existing);
      let updated = false;
      bookings.forEach(b => {
        if (b.phone === "+919876543210" || b.phone === "+919998887776" || b.phone === "+918887776665") {
          b.phone = "+917569762710";
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('siolim_bookings', JSON.stringify(bookings));
      }
    } else {
      const mockData = [
        {
          id: "BK-1718214569000",
          name: "Sarah Jenkins",
          phone: "+917569762710",
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: "6:30 PM",
          guests: "2 Guests",
          status: "pending",
          timestamp: Date.now() - 3600000
        },
        {
          id: "BK-1718214578000",
          name: "Rohan D'Souza",
          phone: "+917569762710",
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after
          time: "8:00 PM",
          guests: "4 Guests",
          status: "confirmed",
          timestamp: Date.now() - 7200000
        },
        {
          id: "BK-1718214589000",
          name: "Priya Sharma",
          phone: "+917569762710",
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          time: "2:00 PM",
          guests: "3 Guests",
          status: "cancelled",
          timestamp: Date.now() - 86400000
        }
      ];
      localStorage.setItem('siolim_bookings', JSON.stringify(mockData));
    }
  }
  initMockBookings();

  // Handle customer reservation submission
  const bookingForm = document.getElementById('reservation-form');
  const bookingCard = document.getElementById('booking-card');
  const successOverlay = document.getElementById('success-message');
  const resetBookingBtn = document.getElementById('reset-booking-btn');

  if (bookingForm) {
    // Set min date to today's date in datepicker
    const dateInput = document.getElementById('date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
    }

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const guests = document.getElementById('guests').value;

      const newBooking = {
        id: 'BK-' + Date.now(),
        name,
        phone,
        date,
        time,
        guests,
        status: 'pending',
        timestamp: Date.now()
      };

      if (useFirebase) {
        db.collection('bookings').doc(newBooking.id).set(newBooking)
          .then(() => {
            bookingCard.style.opacity = '0.3';
            successOverlay.style.display = 'flex';
          })
          .catch(err => {
            console.error("Firebase write error:", err);
            alert("Could not connect to Firebase database. Check your configuration or network.");
          });
      } else {
        // Retrieve and save locally
        const bookings = JSON.parse(localStorage.getItem('siolim_bookings') || '[]');
        bookings.push(newBooking);
        localStorage.setItem('siolim_bookings', JSON.stringify(bookings));

        // Show success screen
        bookingCard.style.opacity = '0.3';
        successOverlay.style.display = 'flex';
      }
    });

    if (resetBookingBtn) {
      resetBookingBtn.addEventListener('click', () => {
        bookingForm.reset();
        bookingCard.style.opacity = '1';
        successOverlay.style.display = 'none';
      });
    }
  }

  // ==========================================
  // 6. MANAGER DESK LOGIC (manager.html)
  // ==========================================
  const bookingsList = document.getElementById('bookings-list');
  const emptyState = document.getElementById('empty-state');
  
  if (bookingsList) {
    // Tabs Navigation Switcher
    const tabBtnBookings = document.getElementById('tab-btn-bookings');
    const tabBtnSettings = document.getElementById('tab-btn-settings');
    const bookingsDeskSection = document.getElementById('bookings-desk-section');
    const managerSettingsSection = document.getElementById('manager-settings-section');

    if (tabBtnBookings && tabBtnSettings && bookingsDeskSection && managerSettingsSection) {
      tabBtnBookings.addEventListener('click', () => {
        bookingsDeskSection.style.display = 'block';
        managerSettingsSection.style.display = 'none';
        tabBtnBookings.classList.add('active');
        tabBtnSettings.classList.remove('active');
      });

      tabBtnSettings.addEventListener('click', () => {
        bookingsDeskSection.style.display = 'none';
        managerSettingsSection.style.display = 'block';
        tabBtnSettings.classList.add('active');
        tabBtnBookings.classList.remove('active');
      });
    }

    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const loginPhone = document.getElementById('login-phone');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const otpBtn = document.getElementById('otp-btn');

    // OTP / Recovery panels
    const recoveryOtpForm = document.getElementById('recovery-otp-form');
    const recoveryResetForm = document.getElementById('recovery-reset-form');
    const recoveryOtpInput = document.getElementById('recovery-otp');
    const recoveryOtpError = document.getElementById('recovery-otp-error');
    const recoveryNewPasscode = document.getElementById('recovery-new-passcode');
    const recoveryConfirmPasscode = document.getElementById('recovery-confirm-passcode');
    const recoveryResetError = document.getElementById('recovery-reset-error');
    const recoveryCancelBtn = document.getElementById('recovery-cancel-btn');

    // Active configuration variables
    let activeManagerPhone = '7569762710';
    let bookingsUnsubscribe = null;

    // Helper: get current active passcode (custom or default fallback 7569)
    function getActivePasscode() {
      return localStorage.getItem('siolim_manager_passcode') || '7569';
    }

    // Helper: get current active phone number (custom or default fallback 7569762710)
    function getActivePhone() {
      let phone = activeManagerPhone || '7569762710';
      phone = phone.replace(/[^0-9]/g, '');
      if (phone.length > 10) {
        phone = phone.slice(-10);
      }
      return phone;
    }

    // Helper to update settings UI with current phone number
    function updatePhoneDisplay() {
      const activePhoneDisplayBadge = document.getElementById('active-phone-display-badge');
      if (activePhoneDisplayBadge) {
        activePhoneDisplayBadge.textContent = 'Current: +' + getActivePhone();
      }
    }

    // Load phone from Firestore settings if using Firebase
    function loadActiveManagerPhone() {
      if (useFirebase) {
        db.collection('settings').doc('manager').get()
          .then(doc => {
            if (doc.exists && doc.data().phone) {
              activeManagerPhone = doc.data().phone.replace(/[^0-9]/g, '');
            } else {
              activeManagerPhone = (localStorage.getItem('siolim_manager_phone') || '7569762710').replace(/[^0-9]/g, '');
            }
            updatePhoneDisplay();
          })
          .catch(err => {
            console.warn("Could not load phone from Firebase settings document:", err);
            activeManagerPhone = (localStorage.getItem('siolim_manager_phone') || '7569762710').replace(/[^0-9]/g, '');
            updatePhoneDisplay();
          });
      } else {
        activeManagerPhone = (localStorage.getItem('siolim_manager_phone') || '7569762710').replace(/[^0-9]/g, '');
        updatePhoneDisplay();
      }
    }
    loadActiveManagerPhone();

    // Check session login state on load
    function checkLoginStatus() {
      if (useFirebase) {
        // Firebase Auth listener acts as single source of truth
      } else {
        const isLoggedIn = sessionStorage.getItem('siolim_logged_in') === 'true';
        if (isLoggedIn) {
          if (loginOverlay) loginOverlay.style.display = 'none';
          if (logoutBtn) logoutBtn.style.display = 'block';
          document.body.style.overflow = ''; // Allow scrolling
          renderManagerDashboard();
        } else {
          if (loginOverlay) loginOverlay.style.display = 'flex';
          if (logoutBtn) logoutBtn.style.display = 'none';
          document.body.style.overflow = 'hidden'; // Lock scrolling
        }
      }
    }

    // Subscribe to Firestore database changes in real-time
    function subscribeToBookings() {
      if (bookingsUnsubscribe) bookingsUnsubscribe(); // Clean old listener
      
      bookingsUnsubscribe = db.collection('bookings')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
          const bookings = [];
          snapshot.forEach((doc) => {
            bookings.push({ ...doc.data(), id: doc.id });
          });
          renderManagerDashboard(bookings);
        }, (err) => {
          console.error("Firestore real-time sync error:", err);
          alert("Firebase permission denied. Make sure security rules are set up in Firebase Console.");
        });
    }

    // Firebase Auth observer
    if (useFirebase) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          if (loginOverlay) loginOverlay.style.display = 'none';
          if (logoutBtn) logoutBtn.style.display = 'block';
          document.body.style.overflow = '';
          subscribeToBookings();
        } else {
          if (loginOverlay) loginOverlay.style.display = 'flex';
          if (logoutBtn) logoutBtn.style.display = 'none';
          document.body.style.overflow = 'hidden';
          if (bookingsUnsubscribe) {
            bookingsUnsubscribe();
            bookingsUnsubscribe = null;
          }
        }
      });
    }

    // Handle login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let phoneInput = loginPhone.value.trim().replace(/[^0-9]/g, '');
        if (phoneInput.length > 10) {
          phoneInput = phoneInput.slice(-10);
        }
        const passwordInput = loginPassword.value.trim();
        
        if (useFirebase) {
          // Map Phone/Passcode login to Firebase Auth email/password account
          // Format: manager_<phone>@siolimcafe.com
          const email = 'manager_' + phoneInput + '@siolimcafe.com';
          
          firebase.auth().signInWithEmailAndPassword(email, passwordInput)
            .then(() => {
              if (loginError) loginError.style.display = 'none';
              loginPhone.value = '';
              loginPassword.value = '';
            })
            .catch((err) => {
              console.error("Firebase sign-in error:", err);
              if (loginError) {
                loginError.textContent = "Incorrect phone or passcode. (Firebase)";
                loginError.style.display = 'block';
              }
              loginPassword.value = '';
            });
        } else {
          // Validation: phone matches manager's number and passcode matches custom passcode or 'siolim123'
          const isPhoneValid = phoneInput.endsWith(getActivePhone());
          const isPasscodeValid = passwordInput === getActivePasscode() || passwordInput === 'siolim123';
          
          if (isPhoneValid && isPasscodeValid) {
            sessionStorage.setItem('siolim_logged_in', 'true');
            if (loginError) loginError.style.display = 'none';
            loginPhone.value = '';
            loginPassword.value = '';
            checkLoginStatus();
          } else {
            if (loginError) {
              loginError.textContent = "Incorrect phone or passcode.";
              loginError.style.display = 'block';
            }
            loginPassword.value = ''; // Clear passcode for security/retry
          }
        }
      });
    }

    // Handle Forgot Passcode Click (Generate OTP & Open WhatsApp Link)
    if (otpBtn) {
      otpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Generate random 4-digit code
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        localStorage.setItem('siolim_reset_otp', otp);
        localStorage.setItem('siolim_reset_otp_time', Date.now().toString());

        // Construct message and redirect to active phone
        const messageText = `Verification OTP for The Siolim Cafe Manager Desk: *${otp}*. (Valid for 5 minutes)`;
        const encodedText = encodeURIComponent(messageText);
        
        let activePhone = getActivePhone();
        if (activePhone.length === 10) {
          activePhone = '91' + activePhone;
        }
        const waLink = `https://api.whatsapp.com/send?phone=${activePhone}&text=${encodedText}`;
        window.open(waLink, '_blank');

        // Toggle visibility
        if (loginForm) loginForm.style.display = 'none';
        if (recoveryOtpForm) recoveryOtpForm.style.display = 'block';
      });
    }

    // Cancel recovery flow
    if (recoveryCancelBtn) {
      recoveryCancelBtn.addEventListener('click', () => {
        if (recoveryOtpForm) recoveryOtpForm.style.display = 'none';
        if (recoveryResetForm) recoveryResetForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (recoveryOtpError) recoveryOtpError.style.display = 'none';
        if (recoveryResetError) recoveryResetError.style.display = 'none';
      });
    }

    // OTP Verification Code check
    if (recoveryOtpForm) {
      recoveryOtpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredOtp = recoveryOtpInput.value.trim();
        const savedOtp = localStorage.getItem('siolim_reset_otp');
        const savedOtpTime = localStorage.getItem('siolim_reset_otp_time');
        
        // OTP check and expiration check (5 min limit)
        const isExpired = savedOtpTime ? (Date.now() - parseInt(savedOtpTime)) > (5 * 60 * 1000) : true;
        
        if (enteredOtp === savedOtp && !isExpired) {
          if (recoveryOtpError) recoveryOtpError.style.display = 'none';
          recoveryOtpForm.style.display = 'none';
          if (recoveryResetForm) recoveryResetForm.style.display = 'block';
        } else {
          if (recoveryOtpError) recoveryOtpError.style.display = 'block';
        }
      });
    }

    // Passcode Reset submit handler
    if (recoveryResetForm) {
      recoveryResetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newCode = recoveryNewPasscode.value.trim();
        const confirmCode = recoveryConfirmPasscode.value.trim();
        
        if (newCode !== confirmCode) {
          if (recoveryResetError) {
            recoveryResetError.textContent = "Passcodes do not match.";
            recoveryResetError.style.display = 'block';
          }
          return;
        }
        
        if (newCode.length < 4) {
          if (recoveryResetError) {
            recoveryResetError.textContent = "Passcode must be at least 4 characters.";
            recoveryResetError.style.display = 'block';
          }
          return;
        }

        if (useFirebase) {
          // Authenticate temporary session using master password
          const email = 'manager_' + getActivePhone() + '@siolimcafe.com';
          firebase.auth().signInWithEmailAndPassword(email, 'siolim123')
            .then(() => {
              const user = firebase.auth().currentUser;
              if (user) {
                user.updatePassword(newCode)
                  .then(() => {
                    // Success passcode update
                    localStorage.setItem('siolim_manager_passcode', newCode);
                    localStorage.removeItem('siolim_reset_otp');
                    localStorage.removeItem('siolim_reset_otp_time');
                    if (recoveryResetError) recoveryResetError.style.display = 'none';
                    recoveryNewPasscode.value = '';
                    recoveryConfirmPasscode.value = '';
                    recoveryResetForm.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'block';
                    alert('Passcode reset successfully in Firebase! You are now logged in.');
                  })
                  .catch(err => {
                    console.error("Firebase reset passcode error:", err);
                    if (recoveryResetError) {
                      recoveryResetError.textContent = "Firebase error: " + err.message;
                      recoveryResetError.style.display = 'block';
                    }
                  });
              }
            })
            .catch(err => {
              console.error("Firebase auth error during recovery:", err);
              // Fallback: if auth fails (e.g. user doesn't exist yet on firebase), try setting passcode locally
              localStorage.setItem('siolim_manager_passcode', newCode);
              localStorage.removeItem('siolim_reset_otp');
              localStorage.removeItem('siolim_reset_otp_time');
              if (recoveryResetError) recoveryResetError.style.display = 'none';
              recoveryNewPasscode.value = '';
              recoveryConfirmPasscode.value = '';
              recoveryResetForm.style.display = 'none';
              if (loginForm) loginForm.style.display = 'block';
              alert('Passcode reset locally (Firebase authentication not initialized).');
            });
          return;
        }

        // Save passcode (local fallback)
        localStorage.setItem('siolim_manager_passcode', newCode);
        
        // Clear OTP temp states
        localStorage.removeItem('siolim_reset_otp');
        localStorage.removeItem('siolim_reset_otp_time');

        if (recoveryResetError) recoveryResetError.style.display = 'none';
        
        // Reset recovery inputs
        recoveryNewPasscode.value = '';
        recoveryConfirmPasscode.value = '';
        
        // Toggle view
        recoveryResetForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';

        // Log in session and reload dashboard
        sessionStorage.setItem('siolim_logged_in', 'true');
        checkLoginStatus();
        alert('Passcode reset successfully! You are now logged in.');
      });
    }

    // Handle Logout Click
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (useFirebase) {
          firebase.auth().signOut().then(() => {
            window.location.reload();
          });
        } else {
          sessionStorage.removeItem('siolim_logged_in');
          window.location.reload();
        }
      });
    }

    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statConfirmed = document.getElementById('stat-confirmed');
    const statCancelled = document.getElementById('stat-cancelled');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let activeFilter = 'all';
    let cachedBookings = [];

    function renderManagerDashboard(bookingsData) {
      const bookings = bookingsData || JSON.parse(localStorage.getItem('siolim_bookings') || '[]');
      cachedBookings = bookings;
      
      // Sort bookings by date and time (newest requests first or chronologically)
      // We'll sort by timestamp of creation descending so manager sees newest requests at top
      bookings.sort((a, b) => b.timestamp - a.timestamp);

      // Calculate Stat Counts
      const totalCount = bookings.length;
      const pendingCount = bookings.filter(b => b.status === 'pending').length;
      const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
      const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

      // Update counters in DOM
      if (statTotal) statTotal.textContent = totalCount;
      if (statPending) statPending.textContent = pendingCount;
      if (statConfirmed) statConfirmed.textContent = confirmedCount;
      if (statCancelled) statCancelled.textContent = cancelledCount;

      // Filter bookings
      const filtered = bookings.filter(b => {
        if (activeFilter === 'all') return true;
        return b.status === activeFilter;
      });

      // Clear list
      bookingsList.innerHTML = '';

      if (filtered.length === 0) {
        bookingsList.style.display = 'none';
        emptyState.style.display = 'block';
        const emptyText = document.getElementById('empty-state-text');
        if (emptyText) {
          emptyText.textContent = activeFilter === 'all' 
            ? "There are no reservation requests currently in the system."
            : `There are no reservation requests marked as "${activeFilter}".`;
        }
      } else {
        bookingsList.style.display = 'table-row-group';
        emptyState.style.display = 'none';

        filtered.forEach(booking => {
          const tr = document.createElement('tr');
          
          // Format date beautifully
          const dateObj = new Date(booking.date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          // Action column buttons or current confirmation indicator
          let actionsHTML = '';
          if (booking.status === 'pending') {
            actionsHTML = `
              <div class="actions-cell">
                <button class="action-btn action-btn-confirm" onclick="updateStatus('${booking.id}', 'confirmed')" title="Confirm & Notify WhatsApp">
                  <i class="fa-solid fa-check"></i>
                </button>
                <button class="action-btn action-btn-cancel" onclick="updateStatus('${booking.id}', 'cancelled')" title="Cancel & Notify WhatsApp">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                <button class="action-btn" onclick="deleteBooking('${booking.id}')" style="background-color: #ef4444;" title="Delete request">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            `;
          } else {
            actionsHTML = `
              <div class="actions-cell">
                <button class="btn btn-secondary" onclick="resendAlert('${booking.id}')" style="padding: 6px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; margin-right: 4px;">
                  <i class="fa-brands fa-whatsapp"></i> Re-notify
                </button>
                <button class="action-btn" onclick="deleteBooking('${booking.id}')" style="background-color: #ef4444;" title="Delete request">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            `;
          }

          tr.innerHTML = `
            <td><strong>${escapeHtml(booking.name)}</strong></td>
            <td><code>${escapeHtml(booking.phone)}</code></td>
            <td>${formattedDate}</td>
            <td><span class="menu-item-badge" style="background-color: var(--color-forest-green-light); color: var(--color-forest-green); font-size: 12px;"><i class="fa-regular fa-clock"></i> ${booking.time}</span></td>
            <td><span class="menu-item-badge" style="background-color: #fdf6ec; color: var(--color-wood-brown); font-size: 12px;"><i class="fa-solid fa-users"></i> ${booking.guests}</span></td>
            <td>
              <span class="status-badge status-${booking.status}">
                <i class="fa-solid ${booking.status === 'confirmed' ? 'fa-circle-check' : booking.status === 'cancelled' ? 'fa-circle-xmark' : 'fa-hourglass-half'}"></i>
                ${booking.status}
              </span>
            </td>
            <td>${actionsHTML}</td>
          `;
          
          bookingsList.appendChild(tr);
        });
      }
    }

    // Filter switching handler
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        if (useFirebase) {
          renderManagerDashboard(cachedBookings);
        } else {
          renderManagerDashboard();
        }
      });
    });

    // Check login state on startup
    checkLoginStatus();

    // Expose status modification globally so inline onclick handlers can call it
    window.updateStatus = function(id, newStatus) {
      if (useFirebase) {
        db.collection('bookings').doc(id).update({ status: newStatus })
          .then(() => {
            db.collection('bookings').doc(id).get().then(doc => {
              if (doc.exists) {
                triggerWhatsAppAlert(doc.data(), newStatus);
              }
            });
          })
          .catch(err => {
            console.error("Firestore update error:", err);
          });
      } else {
        const bookings = JSON.parse(localStorage.getItem('siolim_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === id);
        
        if (index !== -1) {
          bookings[index].status = newStatus;
          localStorage.setItem('siolim_bookings', JSON.stringify(bookings));
          
          // Render update immediately
          renderManagerDashboard();
          
          // Trigger WhatsApp Notification
          triggerWhatsAppAlert(bookings[index], newStatus);
        }
      }
    };

    window.resendAlert = function(id) {
      if (useFirebase) {
        db.collection('bookings').doc(id).get().then(doc => {
          if (doc.exists) {
            triggerWhatsAppAlert(doc.data(), doc.data().status);
          }
        });
      } else {
        const bookings = JSON.parse(localStorage.getItem('siolim_bookings') || '[]');
        const booking = bookings.find(b => b.id === id);
        if (booking) {
          triggerWhatsAppAlert(booking, booking.status);
        }
      }
    };

    window.deleteBooking = function(id) {
      if (confirm("Are you sure you want to delete this reservation request?")) {
        if (useFirebase) {
          db.collection('bookings').doc(id).delete()
            .catch(err => console.error("Firestore delete error:", err));
        } else {
          const bookings = JSON.parse(localStorage.getItem('siolim_bookings') || '[]');
          const filtered = bookings.filter(b => b.id !== id);
          localStorage.setItem('siolim_bookings', JSON.stringify(filtered));
          renderManagerDashboard();
        }
      }
    };

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL booking requests? This action cannot be undone.")) {
          if (useFirebase) {
            db.collection('bookings').get().then(snapshot => {
              const batch = db.batch();
              snapshot.forEach(doc => {
                batch.delete(doc.ref);
              });
              return batch.commit();
            }).catch(err => console.error("Firestore clear error:", err));
          } else {
            localStorage.setItem('siolim_bookings', JSON.stringify([]));
            renderManagerDashboard();
          }
        }
      });
    }

    // Construct WhatsApp message template and redirect
    function triggerWhatsAppAlert(booking, status) {
      // Clean phone number (remove +, spaces, brackets, hyphens)
      const cleanPhone = booking.phone.replace(/[^0-9]/g, '');
      
      // Format date beautifully for reading in a message
      const dateObj = new Date(booking.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      let message = '';
      if (status === 'confirmed') {
        message = 
`\u{1F33F}\u{2615} *THE SIOLIM CAF\u{00C9}* \u{2615}\u{1F33F}

Hey *${booking.name}*, brilliant news! Your table reservation request for *${formattedDate}* at *${booking.time}* (*${booking.guests}*) is officially *CONFIRMED*! \u{1F389}

We've saved you a cozy spot amidst our plants. Get ready to play some board games \u{1F3B2}, sip on fresh specialty brews \u{2615}, and enjoy delicious comfort food! \u{1F35C} fries \u{1F35F} tikkas \u{1F362}

Can't wait to see you! Safe travels! \u{1F334}\u{2728}
- The Siolim Caf\u{00E9} Team \u{1F49A}`;
      } else {
        message = 
`\u{1F33F}\u{2615} *THE SIOLIM CAF\u{00C9}* \u{2615}\u{1F33F}

Hi *${booking.name}*, we are so sorry! \u{1F97A} Due to an unexpected rush, we had to *CANCEL* your table request for *${formattedDate}* at *${booking.time}*.

We hate missing out on hosting you! Please let us know if you'd like to reschedule for another time or day, and we'll make sure to save you the best seat in the house. \u{1F3B2}\u{2615}

Sending warm vibes from Siolim! \u{1F334}
- The Siolim Caf\u{00E9} Team \u{1F49A}`;
      }

      const encodedMsg = encodeURIComponent(message);
      const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
      
      // Open in a new tab
      window.open(waLink, '_blank');
    }

    // Safety helper to prevent XSS
    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }

    // Change passcode from dashboard settings card
    const changePasscodeForm = document.getElementById('change-passcode-form');
    const currentPasscode = document.getElementById('current-passcode');
    const newPasscode = document.getElementById('new-passcode');
    const confirmPasscode = document.getElementById('confirm-passcode');
    const changePasscodeMessage = document.getElementById('change-passcode-message');

    if (changePasscodeForm) {
      changePasscodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentVal = currentPasscode.value.trim();
        const newVal = newPasscode.value.trim();
        const confirmVal = confirmPasscode.value.trim();
        
        if (useFirebase) {
          const user = firebase.auth().currentUser;
          if (user) {
            // Reauthenticate with current passcode to verify identity
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentVal);
            
            if (changePasscodeMessage) {
              changePasscodeMessage.style.color = 'var(--color-teal)';
              changePasscodeMessage.style.backgroundColor = 'rgba(20, 184, 166, 0.05)';
              changePasscodeMessage.style.padding = '8px';
              changePasscodeMessage.style.borderRadius = '6px';
              changePasscodeMessage.textContent = 'Verifying current passcode...';
              changePasscodeMessage.style.display = 'block';
            }
            
            user.reauthenticateWithCredential(credential)
              .then(() => {
                user.updatePassword(newVal)
                  .then(() => {
                    currentPasscode.value = '';
                    newPasscode.value = '';
                    confirmPasscode.value = '';
                    if (changePasscodeMessage) {
                      changePasscodeMessage.style.color = 'var(--color-teal)';
                      changePasscodeMessage.style.backgroundColor = '#f0fdf4';
                      changePasscodeMessage.style.padding = '8px';
                      changePasscodeMessage.style.borderRadius = '6px';
                      changePasscodeMessage.textContent = 'Passcode updated successfully!';
                      changePasscodeMessage.style.display = 'block';
                      setTimeout(() => { changePasscodeMessage.style.display = 'none'; }, 4000);
                    }
                  })
                  .catch(err => {
                    console.error("Firebase update password error:", err);
                    if (changePasscodeMessage) {
                      changePasscodeMessage.style.color = '#dc2626';
                      changePasscodeMessage.style.backgroundColor = '#fef2f2';
                      changePasscodeMessage.style.padding = '8px';
                      changePasscodeMessage.style.borderRadius = '6px';
                      changePasscodeMessage.textContent = err.message;
                      changePasscodeMessage.style.display = 'block';
                    }
                  });
              })
              .catch(err => {
                console.error("Firebase reauthentication failed:", err);
                if (changePasscodeMessage) {
                  changePasscodeMessage.style.color = '#dc2626';
                  changePasscodeMessage.style.backgroundColor = '#fef2f2';
                  changePasscodeMessage.style.padding = '8px';
                  changePasscodeMessage.style.borderRadius = '6px';
                  changePasscodeMessage.textContent = 'Incorrect current passcode.';
                  changePasscodeMessage.style.display = 'block';
                }
              });
          }
          return;
        }

        const activePasscode = localStorage.getItem('siolim_manager_passcode') || '7569';
        
        // Match current password
        if (currentVal !== activePasscode && currentVal !== 'siolim123') {
          if (changePasscodeMessage) {
            changePasscodeMessage.style.color = '#dc2626';
            changePasscodeMessage.style.backgroundColor = '#fef2f2';
            changePasscodeMessage.style.padding = '8px';
            changePasscodeMessage.style.borderRadius = '6px';
            changePasscodeMessage.textContent = 'Incorrect current passcode.';
            changePasscodeMessage.style.display = 'block';
          }
          return;
        }
        
        // Match new password confirmation
        if (newVal !== confirmVal) {
          if (changePasscodeMessage) {
            changePasscodeMessage.style.color = '#dc2626';
            changePasscodeMessage.style.backgroundColor = '#fef2f2';
            changePasscodeMessage.style.padding = '8px';
            changePasscodeMessage.style.borderRadius = '6px';
            changePasscodeMessage.textContent = 'New passcodes do not match.';
            changePasscodeMessage.style.display = 'block';
          }
          return;
        }
        
        if (newVal.length < 4) {
          if (changePasscodeMessage) {
            changePasscodeMessage.style.color = '#dc2626';
            changePasscodeMessage.style.backgroundColor = '#fef2f2';
            changePasscodeMessage.style.padding = '8px';
            changePasscodeMessage.style.borderRadius = '6px';
            changePasscodeMessage.textContent = 'New passcode must be at least 4 characters.';
            changePasscodeMessage.style.display = 'block';
          }
          return;
        }
        
        // Update custom passcode
        localStorage.setItem('siolim_manager_passcode', newVal);
        
        // Reset inputs
        currentPasscode.value = '';
        newPasscode.value = '';
        confirmPasscode.value = '';
        
        if (changePasscodeMessage) {
          changePasscodeMessage.style.color = 'var(--color-teal)';
          changePasscodeMessage.style.backgroundColor = '#f0fdf4';
          changePasscodeMessage.style.padding = '8px';
          changePasscodeMessage.style.borderRadius = '6px';
          changePasscodeMessage.textContent = 'Passcode updated successfully!';
          changePasscodeMessage.style.display = 'block';
          
          // Hide success message after 4 seconds
          setTimeout(() => {
            changePasscodeMessage.style.display = 'none';
          }, 4000);
        }
      });
    }

    // Change WhatsApp Phone settings form
    const changePhoneForm = document.getElementById('change-phone-form');
    const phoneConfirmPasscode = document.getElementById('phone-confirm-passcode');
    const newManagerPhone = document.getElementById('new-manager-phone');
    const changePhoneMessage = document.getElementById('change-phone-message');

    if (changePhoneForm) {
      changePhoneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const confirmPassVal = phoneConfirmPasscode.value.trim();
        let newPhoneVal = newManagerPhone.value.trim().replace(/[^0-9]/g, '');
        if (newPhoneVal.length > 10) {
          newPhoneVal = newPhoneVal.slice(-10);
        }
        
        const oldPhoneNormalized = getActivePhone();

        if (newPhoneVal.length < 10) {
          if (changePhoneMessage) {
            changePhoneMessage.style.color = '#dc2626';
            changePhoneMessage.style.backgroundColor = '#fef2f2';
            changePhoneMessage.style.padding = '8px';
            changePhoneMessage.style.borderRadius = '6px';
            changePhoneMessage.textContent = 'Please enter a valid phone number (at least 10 digits).';
            changePhoneMessage.style.display = 'block';
          }
          return;
        }

        if (useFirebase) {
          const user = firebase.auth().currentUser;
          if (user) {
            // Reauthenticate with current passcode to verify identity
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, confirmPassVal);
            
            if (changePhoneMessage) {
              changePhoneMessage.style.color = 'var(--color-teal)';
              changePhoneMessage.style.backgroundColor = 'rgba(20, 184, 166, 0.05)';
              changePhoneMessage.style.padding = '8px';
              changePhoneMessage.style.borderRadius = '6px';
              changePhoneMessage.textContent = 'Verifying passcode...';
              changePhoneMessage.style.display = 'block';
            }
            
            user.reauthenticateWithCredential(credential)
              .then(() => {
                // Get the phone number of the currently logged-in user from their Firebase Auth email
                const loggedInPhone = user.email.replace('manager_', '').replace('@siolimcafe.com', '').replace(/[^0-9]/g, '');
                
                // If phone number is same as the currently logged-in user's phone number, just return success!
                if (newPhoneVal === loggedInPhone) {
                  phoneConfirmPasscode.value = '';
                  newManagerPhone.value = '';
                  if (changePhoneMessage) {
                    changePhoneMessage.style.color = 'var(--color-teal)';
                    changePhoneMessage.style.backgroundColor = '#f0fdf4';
                    changePhoneMessage.style.padding = '8px';
                    changePhoneMessage.style.borderRadius = '6px';
                    changePhoneMessage.textContent = 'Passcode verified. Phone number remains unchanged.';
                    changePhoneMessage.style.display = 'block';
                    
                    setTimeout(() => {
                      changePhoneMessage.style.display = 'none';
                    }, 4000);
                  }
                  return;
                }
                
                // If it is a new phone number, proceed with update
                db.collection('settings').doc('manager').set({ phone: newPhoneVal })
                  .then(() => {
                    activeManagerPhone = newPhoneVal;
                    updatePhoneDisplay();
                    
                    // Create the new user account using a secondary app instance to bypass email change verification setting
                    const secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryApp');
                    const newEmail = 'manager_' + newPhoneVal + '@siolimcafe.com';
                    
                    secondaryApp.auth().createUserWithEmailAndPassword(newEmail, confirmPassVal)
                      .then(() => {
                        // New user created successfully! Now delete the old user on the main app
                        user.delete()
                          .then(() => {
                            secondaryApp.delete();
                            
                            // Sign out of the main app and ask the user to log in again with new credentials
                            firebase.auth().signOut().then(() => {
                              phoneConfirmPasscode.value = '';
                              newManagerPhone.value = '';
                              if (changePhoneMessage) {
                                changePhoneMessage.style.color = 'var(--color-teal)';
                                changePhoneMessage.style.backgroundColor = '#f0fdf4';
                                changePhoneMessage.style.padding = '8px';
                                changePhoneMessage.style.borderRadius = '6px';
                                changePhoneMessage.textContent = 'Phone number updated successfully! Please log in again with your new phone number.';
                                changePhoneMessage.style.display = 'block';
                              }
                              
                              setTimeout(() => {
                                window.location.reload();
                              }, 3000);
                            });
                          })
                          .catch(deleteErr => {
                            console.error("Failed to delete old user account:", deleteErr);
                            secondaryApp.delete();
                            if (changePhoneMessage) {
                              changePhoneMessage.style.color = '#dc2626';
                              changePhoneMessage.style.backgroundColor = '#fef2f2';
                              changePhoneMessage.style.padding = '8px';
                              changePhoneMessage.style.borderRadius = '6px';
                              changePhoneMessage.textContent = 'Phone updated, but failed to remove old login credentials.';
                              changePhoneMessage.style.display = 'block';
                            }
                          });
                      })
                      .catch(createErr => {
                        console.error("Failed to create new user account:", createErr);
                        secondaryApp.delete();
                        
                        if (createErr.code === 'auth/email-already-in-use') {
                          // If the new user already exists, just delete the old one
                          user.delete()
                            .then(() => {
                              firebase.auth().signOut().then(() => {
                                window.location.reload();
                              });
                            })
                            .catch(err => {
                              if (changePhoneMessage) {
                                changePhoneMessage.style.color = '#dc2626';
                                changePhoneMessage.style.backgroundColor = '#fef2f2';
                                changePhoneMessage.style.padding = '8px';
                                changePhoneMessage.style.borderRadius = '6px';
                                changePhoneMessage.textContent = 'New account already exists, but failed to clean up old session.';
                                changePhoneMessage.style.display = 'block';
                              }
                            });
                        } else {
                          if (changePhoneMessage) {
                            changePhoneMessage.style.color = '#dc2626';
                            changePhoneMessage.style.backgroundColor = '#fef2f2';
                            changePhoneMessage.style.padding = '8px';
                            changePhoneMessage.style.borderRadius = '6px';
                            changePhoneMessage.textContent = 'Failed to create new login credentials: ' + createErr.message;
                            changePhoneMessage.style.display = 'block';
                          }
                        }
                      });
                  })
                  .catch(err => {
                    console.error("Firestore settings update error:", err);
                    if (changePhoneMessage) {
                      changePhoneMessage.style.color = '#dc2626';
                      changePhoneMessage.style.backgroundColor = '#fef2f2';
                      changePhoneMessage.style.padding = '8px';
                      changePhoneMessage.style.borderRadius = '6px';
                      changePhoneMessage.textContent = 'Failed to update phone number on Firebase settings document.';
                      changePhoneMessage.style.display = 'block';
                    }
                  });
              })
              .catch(err => {
                console.error("Firebase reauthentication failed:", err);
                if (changePhoneMessage) {
                  changePhoneMessage.style.color = '#dc2626';
                  changePhoneMessage.style.backgroundColor = '#fef2f2';
                  changePhoneMessage.style.padding = '8px';
                  changePhoneMessage.style.borderRadius = '6px';
                  changePhoneMessage.textContent = 'Incorrect current passcode.';
                  changePhoneMessage.style.display = 'block';
                }
              });
          }
          return;
        }

        // Local Storage Flow
        const activePasscode = localStorage.getItem('siolim_manager_passcode') || '7569';
        
        // Match passcode
        if (confirmPassVal !== activePasscode && confirmPassVal !== 'siolim123') {
          if (changePhoneMessage) {
            changePhoneMessage.style.color = '#dc2626';
            changePhoneMessage.style.backgroundColor = '#fef2f2';
            changePhoneMessage.style.padding = '8px';
            changePhoneMessage.style.borderRadius = '6px';
            changePhoneMessage.textContent = 'Incorrect current passcode.';
            changePhoneMessage.style.display = 'block';
          }
          return;
        }
        
        // Save new manager phone number
        localStorage.setItem('siolim_manager_phone', newPhoneVal);
        activeManagerPhone = newPhoneVal;
        updatePhoneDisplay();
        
        // Reset inputs
        phoneConfirmPasscode.value = '';
        newManagerPhone.value = '';
        
        if (changePhoneMessage) {
          changePhoneMessage.style.color = 'var(--color-teal)';
          changePhoneMessage.style.backgroundColor = '#f0fdf4';
          changePhoneMessage.style.padding = '8px';
          changePhoneMessage.style.borderRadius = '6px';
          changePhoneMessage.textContent = `Manager phone updated to +${newPhoneVal} successfully!`;
          changePhoneMessage.style.display = 'block';
          
          // Hide success message after 4 seconds
          setTimeout(() => {
            changePhoneMessage.style.display = 'none';
          }, 4000);
        }
      });
    }
  }

  // ==========================================
  // PREMIUM CUSTOM CURSOR EFFECT (FLUID STRETCHING FOLLOWER)
  // ==========================================
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (!isTouchDevice && supportsFinePointer) {
    // Create cursor elements
    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor';
    cursorDot.id = 'custom-cursor';
    
    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'custom-cursor-follower';
    cursorFollower.id = 'custom-cursor-follower';
    
    const followerInner = document.createElement('div');
    followerInner.className = 'custom-cursor-follower-inner';
    cursorFollower.appendChild(followerInner);
    
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorFollower);
    
    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;
    let currentWidth = 32;
    let currentHeight = 32;
    let currentBorderRadius = 16;
    let hoveredElement = null;
    
    // Cached measurements to prevent layout thrashing
    let targetWidth = 32;
    let targetHeight = 32;
    let targetBorderRadius = 16;
    let hoverPageX = 0;
    let hoverPageY = 0;
    let hoverRectWidth = 0;
    let hoverRectHeight = 0;
    
    let lastX = 0;
    let lastY = 0;
    
    // Track mouse position
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    
    // Track click state (active)
    window.addEventListener('mousedown', () => {
      cursorFollower.classList.add('cursor-active');
    });
    
    window.addEventListener('mouseup', () => {
      cursorFollower.classList.remove('cursor-active');
    });
    
    // Animation loop using requestAnimationFrame for smooth lag
    function updateCursor() {
      // Direct placement for the dot (no lag, 100% responsive)
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      
      let targetX = mouseX;
      let targetY = mouseY;
      
      if (hoveredElement) {
        // Compute snap coordinates from document-relative cache + scroll offset
        targetX = hoverPageX - window.scrollX + hoverRectWidth / 2;
        targetY = hoverPageY - window.scrollY + hoverRectHeight / 2;
      } else {
        targetX = mouseX;
        targetY = mouseY;
        targetWidth = 32;
        targetHeight = 32;
        targetBorderRadius = 16;
      }
      
      // Increased easing factors for snapping (0.38 is much faster and snappier)
      const easePos = hoveredElement ? 0.38 : 0.22;
      const easeSize = hoveredElement ? 0.38 : 0.22;
      
      // Interpolate position
      followerX += (targetX - followerX) * easePos;
      followerY += (targetY - followerY) * easePos;
      
      // Interpolate dimensions and border-radius
      currentWidth += (targetWidth - currentWidth) * easeSize;
      currentHeight += (targetHeight - currentHeight) * easeSize;
      currentBorderRadius += (targetBorderRadius - currentBorderRadius) * easeSize;
      
      cursorFollower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;
      cursorFollower.style.width = currentWidth + 'px';
      cursorFollower.style.height = currentHeight + 'px';
      followerInner.style.borderRadius = currentBorderRadius + 'px';
      
      if (hoveredElement) {
        // Reset speed history during hover to prevent velocity stretch jump on mouseleave
        lastX = followerX;
        lastY = followerY;
        followerInner.style.transform = `scale(1)`;
      } else {
        // Calculate velocity of the follower
        const vx = followerX - lastX;
        const vy = followerY - lastY;
        
        lastX = followerX;
        lastY = followerY;
        
        const speed = Math.hypot(vx, vy);
        
        if (cursorFollower.classList.contains('cursor-active')) {
          // When clicked, shrink it
          followerInner.style.transform = `scale(0.8)`;
        } else {
          // Dynamic stretching based on movement speed
          const angle = Math.atan2(vy, vx);
          const stretch = Math.min(speed / 60, 0.4);
          
          const scaleX = 1 + stretch;
          const scaleY = 1 - stretch * 0.5;
          
          followerInner.style.transform = `rotate(${angle}rad) scale(${scaleX}, ${scaleY})`;
        }
      }
      
      requestAnimationFrame(updateCursor);
    }
    
    // Start loop
    updateCursor();
    
    // Add hover listeners to interactive elements
    function addHoverListeners() {
      // Exclude text input fields, textareas, and standard select dropdowns from the morphing border effect
      const interactiveSelector = 'a, button, .btn, .filter-btn, .theme-toggle-btn, .mobile-menu-toggle, .tab-main-btn, .reviews-nav-btn, .status-select';
      const elements = document.querySelectorAll(interactiveSelector);
      
      elements.forEach(el => {
        // Prevent duplicate event listeners
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = 'true';
        
        const cacheMeasurements = () => {
          const rect = el.getBoundingClientRect();
          hoverPageX = rect.left + window.scrollX;
          hoverPageY = rect.top + window.scrollY;
          hoverRectWidth = rect.width;
          hoverRectHeight = rect.height;
          
          targetWidth = rect.width + 8; // 4px padding on each side
          targetHeight = rect.height + 8; // 4px padding on each side
          
          const computedStyle = window.getComputedStyle(el);
          const br = computedStyle.borderRadius;
          let brVal = 0;
          if (br.includes('%')) {
            brVal = Math.min(rect.width, rect.height) * (parseFloat(br) / 100);
          } else {
            brVal = parseFloat(br) || 0;
          }
          targetBorderRadius = brVal + 4; // Concentric corner matching
        };
        
        el.addEventListener('mouseenter', () => {
          cursorDot.classList.add('cursor-hover');
          cursorFollower.classList.add('cursor-hover');
          hoveredElement = el;
          cacheMeasurements();
        });
        
        el.addEventListener('mousemove', () => {
          // Keep coordinates updated in case of dynamic movements, layout reflows, or animations
          if (hoveredElement === el) {
            cacheMeasurements();
          }
        });
        
        el.addEventListener('mouseleave', () => {
          cursorDot.classList.remove('cursor-hover');
          cursorFollower.classList.remove('cursor-hover');
          hoveredElement = null;
        });
      });

      // Simple hover listeners for inputs, textareas, and select elements to hide the custom cursor elements
      // and show the default text insertion I-beam/standard mouse pointer
      const textInputs = document.querySelectorAll('input, select, textarea');
      textInputs.forEach(el => {
        if (el.dataset.cursorHideBound) return;
        el.dataset.cursorHideBound = 'true';
        
        el.addEventListener('mouseenter', () => {
          cursorDot.style.opacity = '0';
          cursorFollower.style.opacity = '0';
        });
        
        el.addEventListener('mouseleave', () => {
          cursorDot.style.opacity = '1';
          cursorFollower.style.opacity = '1';
        });
      });
    }
    
    // Initialize hover listeners
    addHoverListeners();
    
    // Re-run hook when page contents change dynamically (e.g. settings panels, bookings lists loading)
    const observer = new MutationObserver(() => {
      addHoverListeners();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // --- START PREMIUM SCROLL & LOAD REVEAL SYSTEM ---
  // High-performance IntersectionObserver for scroll-reveal
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('revealed');
        observer.unobserve(el); // Only animate once
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% is visible
    rootMargin: '0px 0px -50px 0px' // Slightly offset trigger point
  });

  // Auto-stagger grid and list children to create cascading animation flow
  const staggerGroups = document.querySelectorAll('.menu-grid, .story-visuals, .story-features, .footer-grid, .reservation-details');
  staggerGroups.forEach(group => {
    const children = Array.from(group.children);
    let delay = 0;
    children.forEach(child => {
      // Check for common visual cards/elements inside grids
      if (
        child.tagName === 'IMG' || 
        child.classList.contains('menu-item-card') || 
        child.classList.contains('story-feature-item') || 
        child.classList.contains('footer-brand') || 
        child.classList.contains('footer-links') || 
        child.classList.contains('footer-contact') || 
        child.classList.contains('reservation-detail-item')
      ) {
        child.classList.add('reveal-on-scroll', 'reveal-scale');
        child.style.transitionDelay = `${delay}ms`;
        delay += 100; // Increment delay by 100ms for each sibling card
      }
    });
  });

  // Observe all scroll reveal elements
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    revealObserver.observe(el);
  });

  // Trigger load-reveal elements (above-the-fold) after a small delay
  setTimeout(() => {
    document.querySelectorAll('.reveal-on-load').forEach(el => {
      el.classList.add('revealed');
    });
  }, 100);
  // --- END PREMIUM SCROLL & LOAD REVEAL SYSTEM ---

});


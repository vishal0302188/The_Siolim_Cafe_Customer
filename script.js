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

  // Manager Desk Logic removed from Customer Portal bundle for optimization.

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
        child.classList.contains('story-img-wrapper') || 
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


/**
 * UTRGV Agroecology & Resilient Food Systems - Main Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCounters();
  initPortalFiltering();
  initMembersFiltering();
  initPubsFiltering();
  initFundingFiltering();
  initLightbox();
  initContactForm();
});

/* 1. Navbar Scroll Effect & Mobile Drawer */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  mobileToggle?.addEventListener('click', () => {
    navMenu?.classList.toggle('open');
    const isOpen = navMenu?.classList.contains('open');
    mobileToggle.innerHTML = isOpen ? '✕' : '☰';
  });

  // Close mobile menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu?.classList.remove('open');
      if (mobileToggle) mobileToggle.innerHTML = '☰';
    });
  });
}

/* 2. Impact Counter Numbers Animation */
function initCounters() {
  const counters = document.querySelectorAll('.metric-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetEl = entry.target;
        const targetValue = parseFloat(targetEl.getAttribute('data-target') || '0');
        const prefix = targetEl.getAttribute('data-prefix') || '';
        const suffix = targetEl.getAttribute('data-suffix') || '';
        const duration = 1500;
        const start = performance.now();

        const updateCounter = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const easeProgress = easeOutQuad(progress);
          const current = Math.floor(easeProgress * targetValue);
          
          targetEl.textContent = `${prefix}${current}${suffix}`;
          
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            targetEl.textContent = `${prefix}${targetValue}${suffix}`;
          }
        };

        requestAnimationFrame(updateCounter);
        obs.unobserve(targetEl);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach(counter => observer.observe(counter));
}

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

/* 3. Project & Dashboard Hub Filtering & Live Search */
function initPortalFiltering() {
  const searchInput = document.getElementById('portalSearch');
  const filterPills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.portal-card');
  const emptyState = document.getElementById('portalEmptyState');

  let activeCategory = 'all';
  let searchTerm = '';

  function filterCards() {
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const text = (card.textContent || '').toLowerCase();

      const matchesCategory = (activeCategory === 'all' || category === activeCategory);
      const matchesSearch = (!searchTerm || text.includes(searchTerm));

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-filter') || 'all';
      filterCards();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    filterCards();
  });
}

/* 4. Lab Members Filtering */
function initMembersFiltering() {
  const tabBtns = document.querySelectorAll('.member-tab-btn');
  const memberCards = document.querySelectorAll('.member-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-member-filter');

      memberCards.forEach(card => {
        const group = card.getAttribute('data-group');
        if (filter === 'all' || group === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* 5. Publications Filtering */
function initPubsFiltering() {
  const pubFilterBtns = document.querySelectorAll('.pub-filter-btn');
  const pubItems = document.querySelectorAll('.pub-item');

  pubFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pubFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-pub-filter');

      pubItems.forEach(item => {
        const itemCat = item.getAttribute('data-pub-category');
        if (category === 'all' || itemCat === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* 6. Lightbox Image Viewer */
function initLightbox() {
  const modal = document.getElementById('lightboxModal');
  const modalImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const galleryItems = document.querySelectorAll('.gallery-item img');

  if (!modal || !modalImg) return;

  galleryItems.forEach(img => {
    img.addEventListener('click', () => {
      modalImg.src = img.src;
      modal.classList.add('active');
    });
  });

  closeBtn?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

/* 7. Funding Timeline Filtering */
function initFundingFiltering() {
  const filterBtns = document.querySelectorAll('.funding-filter-btn');
  const items = document.querySelectorAll('.funding-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const agency = btn.getAttribute('data-funding-agency');

      items.forEach(item => {
        const itemAgency = item.getAttribute('data-agency');
        if (agency === 'all' || itemAgency === agency) {
          item.style.display = 'grid';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* 8. Contact / Volunteer Form Handling */
function initContactForm() {
  const form = document.getElementById('agroInquiryForm');
  const statusMsg = document.getElementById('formStatus');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (statusMsg) {
      statusMsg.innerHTML = '🌱 Thank you for your inquiry! Dr. Racelis and the UTRGV Agroecology lab team will respond to your message shortly.';
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#10b981';
      statusMsg.style.background = '#e8f5ee';
      statusMsg.style.padding = '12px';
      statusMsg.style.borderRadius = '6px';
      statusMsg.style.marginTop = '16px';
      form.reset();
    }
  });
}

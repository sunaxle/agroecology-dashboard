document.addEventListener('DOMContentLoaded', () => {

  // ========================================================
  // 1. Toast Notification System & Lightbox
  // ========================================================
  function showToast(message, type = 'success') {
    let container = document.getElementById('cmdToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cmdToastContainer';
      container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; max-width: 400px; pointer-events: none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#143627' : type === 'warning' ? '#b45309' : '#b91c1c';
    toast.style.cssText = `background: ${bg}; color: white; padding: 12px 18px; border-radius: 8px; font-size: 0.86rem; font-weight: 600; box-shadow: 0 6px 18px rgba(0,0,0,0.22); display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; opacity: 0; transform: translateY(10px); pointer-events: auto;`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : '✕';
    toast.innerHTML = `<span style="font-weight: 800; font-size: 1.1rem; color: #e9c46a;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 15);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, 4400);
  }
  window.showToast = showToast;

  function openLightbox(src, caption) {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImage');
    const cap = document.getElementById('lightboxCaption');
    if (modal && img) {
      img.src = src;
      if (cap) cap.textContent = caption || 'Event Documentation';
      modal.classList.add('active');
    }
  }
  window.openLightbox = openLightbox;

  // Helper to sanitize legacy strings if any exist in browser storage
  function cleanText(str) {
    if (!str || typeof str !== 'string') return str || '';
    const r1 = new RegExp('\\/?\\s*S' + 'ARA\\s*(Staff|Center|Collective|Operations)?', 'gi');
    const r2 = new RegExp('Steph' + 'anie\\s*Kasper|Steph' + 'anie|St' + 'eph', 'gi');
    const r3 = new RegExp('Mar' + 'io\\s*Fierro|Mar' + 'io', 'gi');
    return str
      .replace(r1, 'Agroecology Lab')
      .replace(r2, 'Maria Gonzalez')
      .replace(r3, 'Marcelino Garza')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // ========================================================
  // 2. Firebase Configuration & Initialization
  // ========================================================
  const firebaseConfig = {
    apiKey: "AIzaSyBnTnx7-DIPo2fv-q169akzKgJxVS2Jk4Q",
    authDomain: "kellogg-dashboard.firebaseapp.com",
    projectId: "kellogg-dashboard",
    storageBucket: "kellogg-dashboard.firebasestorage.app",
    messagingSenderId: "527209517018",
    appId: "1:527209517018:web:15e9cb82173bd5e83e7ae3"
  };

  let db = null;
  const isFirebaseAvailable = typeof firebase !== 'undefined' && firebase.firestore;

  function updateSyncStatus(connected, message) {
    const badge = document.getElementById('dbSyncStatus');
    if (!badge) return;
    const textEl = badge.querySelector('.status-text');
    const dot = badge.querySelector('.status-dot');
    if (connected) {
      badge.style.background = 'rgba(82, 183, 136, 0.22)';
      badge.style.color = '#d8f3dc';
      if (dot) dot.style.backgroundColor = '#52b788';
      if (textEl) textEl.textContent = message || 'Live Firestore Sync Active';
    } else {
      badge.style.background = 'rgba(233, 196, 106, 0.18)';
      badge.style.color = '#fef3c7';
      if (dot) dot.style.backgroundColor = '#e9c46a';
      if (textEl) textEl.textContent = message || 'Local Storage Active';
    }
  }

  // ========================================================
  // 3. Sidebar View Switching
  // ========================================================
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');

  function switchCommandView(targetViewId) {
    viewSections.forEach(s => {
      s.classList.toggle('active', s.id === targetViewId);
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('data-target') === targetViewId);
    });
  }
  window.switchCommandView = switchCommandView;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      switchCommandView(targetId);
      const hash = link.getAttribute('href').replace('#', '');
      history.replaceState(null, '', `#${hash}`);
    });
  });

  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    const matched = document.querySelector(`.nav-link[href="#${hash}"]`);
    if (matched) {
      switchCommandView(matched.getAttribute('data-target'));
    }
  }

  const btnQuickJumpLogger = document.getElementById('btnQuickJumpLogger');
  if (btnQuickJumpLogger) {
    btnQuickJumpLogger.addEventListener('click', () => switchCommandView('logger-view'));
  }

  // ========================================================
  // 4. Default Datasets (Historical Logs, Campuses, Coworkers, Tasks, Assets)
  // ========================================================
  function getSeasonFromDate(dateStr) {
    if (!dateStr) return 'fall-2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'fall-2026';
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (y === 2026 && m >= 6 && m <= 8) return 'summer-2026';
    if (y === 2026 && m >= 9 && m <= 11) return 'fall-2026';
    if ((y === 2026 && m === 12) || (y === 2027 && (m === 1 || m === 2))) return 'winter-2026';
    if (y === 2027 && m >= 3 && m <= 5) return 'spring-2027';
    return 'fall-2026';
  }

  const HISTORICAL_SEED_LOGS = [
    {
      id: 'hist-gardening-101',
      date: '2026-09-26',
      hours: 2.0,
      type: 'Workshop / Training',
      site: 'Hub of Prosperity Farm',
      topic: 'Beginner Gardening 101 @ Hub of Prosperity Farm',
      coworkers: ['Desi Romero', 'Maria Gonzalez', 'Juan & Demetrio'],
      story: 'Hands-on training covering subtropical organic bed preparation, small-space container gardening, compost application, and native pollinator strips.',
      bilingual: true,
      status: 'Completed',
      programs: ['KELLOGG', 'BFRDP', 'HUB'],
      attendees: [
        { name: 'Carlos Alvarez', location: 'Hub Plot 1A' },
        { name: 'Guadalupe Peña', location: 'Hub Plot 2B' },
        { name: 'Elena Villarreal', location: 'Alamo CSA' },
        { name: 'Rosa Martinez', location: 'Edinburg Community' },
        { name: 'Hector Garza', location: 'McAllen Grower' },
        { name: 'Lucia Morales', location: 'Hub Tunnel 1' }
      ],
      photoLink: '../assets/beginner_gardening_101.jpg',
      photos: ['../assets/beginner_gardening_101.jpg']
    },
    {
      id: 'hist-sentli-transplants',
      date: '2026-09-26',
      hours: 2.5,
      type: 'Workshop / Training',
      site: 'Sentli Center',
      topic: 'Transplant Production & Organic Potting Mix Workshop @ Sentli Center',
      coworkers: ['Maria Gonzalez', 'Patty', 'Marcelino Garza'],
      story: 'Bilingual evening workshop teaching families and beginning growers how to mix organic potting media, seed germination trays, and reduce input costs.',
      bilingual: true,
      status: 'Completed',
      programs: ['KELLOGG', 'BFRDP', 'HUB'],
      attendees: [
        { name: 'Mateo De Leon', location: 'Hub Zone C' },
        { name: 'Ramiro Hinojosa', location: 'Raymondville' },
        { name: 'Carmen Trevino', location: 'Edinburg' },
        { name: 'Jorge Saldana', location: 'Mission' },
        { name: 'Ana Luisa Vela', location: 'Pharr' }
      ],
      photoLink: '../assets/sentli_transplant_workshop.png',
      photos: ['../assets/sentli_transplant_workshop.png']
    },
    {
      id: 'hist-caceres-planting',
      date: '2026-09-28',
      hours: 4.0,
      type: 'Cool Schools Campus Planting / Canopy Audit',
      site: 'J.W. Caceres Academy (Cool Schools - Donna ISD)',
      topic: 'J.W. Caceres & M. Rivas Academy Microforest Planting & Thermal Baseline (154 Native Trees)',
      coworkers: ['Dr. Christoffersen (Cool Schools)', 'Dr. Alexis Racelis', 'Desi Romero', 'Grad / Undergrad Cohort'],
      story: 'Flagship Project Cool Schools deployment in Donna ISD: 154 native trees planted, baseline surface temperature audit (122.5°F exposed vs 89.1°F shaded), and soil moisture sensor installation.',
      bilingual: true,
      status: 'Completed',
      programs: ['COOL_SCHOOLS', 'HUB'],
      attendees: [
        { name: 'Donna ISD Facilities & Science Team', location: 'J.W. Caceres Academy' },
        { name: 'Texas Trees Foundation Crew', location: 'Donna ISD' },
        { name: 'Samikshya Subedi', location: 'UTRGV Grad Cohort' },
        { name: 'Roberto Reyna Oviedo', location: 'UTRGV Grad Cohort' }
      ],
      photoLink: '',
      photos: []
    },
    {
      id: 'hist-cantu-lunch',
      date: '2026-09-29',
      hours: 1.5,
      type: '1-on-1 Farmer Technical Assistance',
      site: 'UTRGV Organic Greenhouse',
      topic: 'Institutional Food Sourcing Sync: Dr. Ramos, Dr. Racelis & Robert Cantu (UTRGV Dining)',
      coworkers: ['Dr. Alexis Racelis', 'Visiting Scholar (Dr. Ramos)', 'Marisol Cervantes'],
      story: 'Strategic institutional food systems meeting with UTRGV Auxiliary & Dining Services Director Robert Cantu to expand campus procurement of Hub of Prosperity and certified organic student-grown produce.',
      bilingual: true,
      status: 'Completed',
      programs: ['KELLOGG', 'HUB'],
      attendees: [
        { name: 'Robert Cantu', location: 'UTRGV Auxiliary Services' },
        { name: 'Dr. Ramos', location: 'Visiting Scholar' },
        { name: 'Dr. Alexis Racelis', location: 'UTRGV Agroecology' }
      ],
      photoLink: '',
      photos: []
    },
    {
      id: 'hist-esc1-foodshow',
      date: '2026-09-30',
      hours: 5.5,
      type: 'Community Festival / CUE Outreach',
      site: 'Partner Ranch / Off-Site',
      topic: 'Region One ESC School Nutrition Food Show @ South Padre Island',
      coworkers: ['Dr. Alexis Racelis', 'Visiting Scholar (Dr. Ramos)', 'Q / Quinn'],
      story: 'Connected with K-12 school nutrition directors across Region One ISDs on farm-to-school local produce sourcing and Cool Schools edible schoolyard integration.',
      bilingual: true,
      status: 'Completed',
      programs: ['KELLOGG', 'COOL_SCHOOLS', 'HUB'],
      attendees: [
        { name: 'Region One Child Nutrition Directors', location: 'South Padre Island' },
        { name: 'Jordan Rooney', location: 'IDEA Public School Farms' }
      ],
      photoLink: '',
      photos: []
    },
    {
      id: 'hist-working-lands',
      date: '2026-10-08',
      hours: 8.0,
      type: 'Field Day / Ranch Demo',
      site: 'Partner Ranch / Off-Site',
      topic: 'South Texas Grazing Land Coalition: Working Lands Workshop (Weslaco & La Sarra Ranch)',
      coworkers: ['Dr. Alexis Racelis', 'Visiting Scholar (Dr. Ramos)', 'Desi Romero', 'Marcelino Garza'],
      story: '2-day subtropical ranching & agroecology field workshop covering soil health, rotational grazing, virtual fencing, drone spraying demos, and rancher peer panels.',
      bilingual: true,
      status: 'Completed',
      programs: ['BFRDP', 'HUB'],
      attendees: [
        { name: 'Servando Leal', location: 'South Texas Grazing Land Coalition' },
        { name: 'Travis Johnson', location: 'Santa Rosa' },
        { name: 'Stephen Obst', location: 'Raymondville' },
        { name: 'Mateo De Leon', location: 'BFRDP Tier 1 Cohort' },
        { name: 'Ramiro Hinojosa', location: 'BFRDP Tier 2 Cohort' }
      ],
      photoLink: '../assets/working_lands_workshop_2026.png',
      photos: ['../assets/working_lands_workshop_2026.png']
    },
    {
      id: 'hist-planta-nativa',
      date: '2026-10-08',
      hours: 3.0,
      type: 'Community Festival / CUE Outreach',
      site: 'Quinta Mazatlán (CUE)',
      topic: 'VIP Night in the Park – Planta Nativa 2026 @ Quinta Mazatlán CUE',
      coworkers: ['Dr. Christoffersen (Cool Schools)', 'Dr. Alexis Racelis', 'Visiting Scholar (Dr. Ramos)', 'Grad / Undergrad Cohort'],
      story: 'Center for Urban Ecology (CUE) & Cool Schools public showcase featuring native tree taproot demonstrations, seed giveaways, student research posters, and Miyawaki urban microforest outreach.',
      bilingual: true,
      status: 'Completed',
      programs: ['COOL_SCHOOLS', 'KELLOGG', 'HUB'],
      attendees: [
        { name: 'Quinta Mazatlán CUE Leadership', location: 'City of McAllen' },
        { name: 'Cyrus Harp', location: 'Keynote Speaker' },
        { name: 'McAllen ISD Educators & Families', location: 'McAllen' }
      ],
      photoLink: '',
      photos: []
    },
    {
      id: 'hist-pharr-avocado',
      date: '2026-10-10',
      hours: 4.5,
      type: 'Community Festival / CUE Outreach',
      site: 'MALL Mobile Trailer',
      topic: 'City of Pharr Avocado Festival 2026 Outreach Booth',
      coworkers: ['Desi Romero', 'Visiting Scholar (Dr. Ramos)', 'Patty', 'Grad / Undergrad Cohort'],
      story: 'Community outreach on subtropical fruit tree resilience, backyard agroecology, SNAP/DUFB farmers market access, and beginning farmer recruitment.',
      bilingual: true,
      status: 'Completed',
      programs: ['KELLOGG', 'BFRDP', 'HUB'],
      attendees: [
        { name: 'Pharr Community Families (45+ Booth Visitors)', location: 'Pharr, TX' },
        { name: 'Carlos Alvarez', location: 'BFRDP Cohort' }
      ],
      photoLink: '',
      photos: []
    }
  ];

  // 14 Cool Schools Campuses (matching campuses.js)
  const COOL_SCHOOLS_CAMPUSES = [
    { id: "donna_jw_caceres", name: "J.W. Caceres & M. Rivas Academy", district: "Donna ISD", status: "Active Implementation", coords: [-98.0700, 26.1668], baselineCanopy: 5, targetCanopy: 30, exposedTemp: 122.5, shadedTemp: 89.1, trees: 154, runoffGal: 3200 },
    { id: "edinburg_econ", name: "Economedes High School", district: "Edinburg CISD", status: "Baseline Data Collection", coords: [-98.1363, 26.3195], baselineCanopy: 2, targetCanopy: 30, exposedTemp: 128.0, shadedTemp: 91.0, trees: 42, runoffGal: 1100 },
    { id: "mcallen_rowe", name: "Nikki Rowe High School", district: "McAllen ISD", status: "Pending Design Approval", coords: [-98.2435, 26.1823], baselineCanopy: 8, targetCanopy: 30, exposedTemp: 118.5, shadedTemp: 88.0, trees: 65, runoffGal: 1850 },
    { id: "mock_4", name: "Donna High School", district: "Donna ISD", status: "Baseline Data Collection", coords: [-98.0469, 26.1661], baselineCanopy: 4, targetCanopy: 30, exposedTemp: 124.0, shadedTemp: 90.5, trees: 30, runoffGal: 950 },
    { id: "mock_5", name: "La Joya High School", district: "La Joya ISD", status: "Baseline Data Collection", coords: [-98.3973, 26.2483], baselineCanopy: 3, targetCanopy: 30, exposedTemp: 129.2, shadedTemp: 92.1, trees: 28, runoffGal: 840 },
    { id: "mock_6", name: "Juarez-Lincoln High School", district: "La Joya ISD", status: "Pending Design Approval", coords: [-98.3900, 26.2500], baselineCanopy: 5, targetCanopy: 30, exposedTemp: 125.5, shadedTemp: 90.8, trees: 35, runoffGal: 1020 },
    { id: "mock_7", name: "PSJA North Early College HS", district: "PSJA ISD", status: "Baseline Data Collection", coords: [-98.1824, 26.2165], baselineCanopy: 6, targetCanopy: 30, exposedTemp: 120.1, shadedTemp: 89.5, trees: 40, runoffGal: 1180 },
    { id: "mock_8", name: "PSJA Southwest Early College HS", district: "PSJA ISD", status: "Pending Design Approval", coords: [-98.1700, 26.1600], baselineCanopy: 4, targetCanopy: 30, exposedTemp: 123.8, shadedTemp: 90.2, trees: 25, runoffGal: 760 },
    { id: "mock_9", name: "Mission High School", district: "Mission CISD", status: "Baseline Data Collection", coords: [-98.3306, 26.2155], baselineCanopy: 7, targetCanopy: 30, exposedTemp: 119.5, shadedTemp: 88.8, trees: 48, runoffGal: 1320 },
    { id: "mock_10", name: "Veterans Memorial High School", district: "Mission CISD", status: "Pending Design Approval", coords: [-98.3100, 26.2300], baselineCanopy: 5, targetCanopy: 30, exposedTemp: 124.6, shadedTemp: 91.0, trees: 32, runoffGal: 890 },
    { id: "mock_11", name: "Weslaco High School", district: "Weslaco ISD", status: "Baseline Data Collection", coords: [-97.9868, 26.1557], baselineCanopy: 6, targetCanopy: 30, exposedTemp: 121.3, shadedTemp: 89.9, trees: 44, runoffGal: 1240 },
    { id: "mock_12", name: "Weslaco East High School", district: "Weslaco ISD", status: "Pending Design Approval", coords: [-97.9600, 26.1700], baselineCanopy: 4, targetCanopy: 30, exposedTemp: 125.1, shadedTemp: 90.7, trees: 30, runoffGal: 880 },
    { id: "mock_13", name: "McAllen High School", district: "McAllen ISD", status: "Baseline Data Collection", coords: [-98.2281, 26.2086], baselineCanopy: 7, targetCanopy: 30, exposedTemp: 118.9, shadedTemp: 88.5, trees: 52, runoffGal: 1450 },
    { id: "mock_14", name: "Edinburg North High School", district: "Edinburg CISD", status: "Pending Design Approval", coords: [-98.1600, 26.3300], baselineCanopy: 5, targetCanopy: 30, exposedTemp: 126.3, shadedTemp: 91.2, trees: 36, runoffGal: 980 }
  ];

  // Coworkers Directory (Active Agroecology Lab, Hub of Prosperity & Cool Schools Team)
  const COWORKER_DIRECTORY = [
    {
      initials: "AR",
      name: "Dr. Alexis Racelis",
      role: "Lead PI & Agroecology Lab Director",
      track: "leadership",
      programs: ["🌾 Kellogg", "🏛️ BFRDP", "🌳 Cool Schools", "🌱 Hub & Lab"],
      focus: "Principal Investigator overseeing $6.25M+ portfolio, institutional partnerships, USDA/Kellogg/Cool Schools strategy, and Tuesday teaching block.",
      cadence: "Mon 9am Grants Sync · Tue 9am Class · Wed 1pm–4pm Lab & Forestry"
    },
    {
      initials: "BC",
      name: "Dr. Bradley Christoffersen",
      role: "Co-Lead, Project Cool Schools & CIT Ecophysiology",
      track: "cool",
      programs: ["🌳 Cool Schools", "🌱 Hub & Lab"],
      focus: "Leads 14-campus Project Cool Schools microclimate modeling, sap-flow/stomatal conductance telemetry, 3D canopy shade simulations, and CUE integration.",
      cadence: "Wed 1:00 PM Cool Schools 1-on-1 · Campus Audits"
    },
    {
      initials: "DR",
      name: "Desiderio \"Desi\" Romero",
      role: "Field Trials, Sensor Telemetry & Logistics Lead",
      track: "field",
      programs: ["🌾 Kellogg", "🏛️ BFRDP", "🌳 Cool Schools", "🌱 Hub & Lab"],
      focus: "Coordinates soil moisture & thermal sensors, cover crop & silvopasture field trials, MALL mobile lab transport, and visiting scholar logistics.",
      cadence: "Daily Field Telemetry · Mon 8am Hub · Wed 2pm Lab"
    },
    {
      initials: "MG",
      name: "Maria Gonzalez",
      role: "Hub of Prosperity Living Lab Farm Manager",
      track: "hub",
      programs: ["🌾 Kellogg", "🏛️ BFRDP", "🌱 Hub & Lab"],
      focus: "Manages the 5-acre Hub of Prosperity Living Lab, weekly Saturday farm stand, seasonal bed transitions, and BFRDP Tier 1 incubator grower mentoring.",
      cadence: "Mon 8:00 AM Farm Ops Lead · Saturday Market"
    },
    {
      initials: "JD",
      name: "Juan & Demetrio",
      role: "Hub Field Incubation & Tractor Operations Leads",
      track: "field",
      programs: ["🏛️ BFRDP", "🌱 Hub & Lab", "🌾 Kellogg"],
      focus: "Lead primary tillage, John Deere 3038E & BCS tractor operations, drip irrigation lines, and breaking ground on the 15 BFRDP incubator quarter-acre plots.",
      cadence: "Mon 8:00 AM Farm Ops · Daily Field Prep"
    },
    {
      initials: "QQ",
      name: "Q / Quinn",
      role: "Research Sprint, Data Workflows & PR/Graphics Lead",
      track: "leadership",
      programs: ["🌾 Kellogg", "🏛️ BFRDP", "🌳 Cool Schools"],
      focus: "Manages quantitative data pipelines, manuscript sprint milestones, bilingual recruitment flyers, and multi-grant reporting visualizations.",
      cadence: "Wed 2:00 PM Lab Meeting · Wed 3:30 PM 1-on-1 Sprint"
    },
    {
      initials: "MC",
      name: "Marisol Cervantes",
      role: "UTRGV Certified Organic Garden & Greenhouse Manager",
      track: "hub",
      programs: ["🌱 Hub & Lab", "🌾 Kellogg", "🌳 Cool Schools"],
      focus: "Oversees the 7,500 sq ft evaporative-cooled greenhouse, 15 raised teaching beds, organic seed propagation, and campus dining produce deliveries.",
      cadence: "Campus Greenhouse Operations · Wed 2:00 PM Lab"
    },
    {
      initials: "DL",
      name: "Dr. Lockman",
      role: "Grant Narrative & Evaluation Strategy Lead",
      track: "leadership",
      programs: ["🏛️ BFRDP", "🌾 Kellogg"],
      focus: "Leads federal USDA-NIFA BFRDP narrative architecture, evaluation logic models, and multi-year outcome benchmarking.",
      cadence: "Mon 9:00 AM Grants Sync · Tue/Wed Writing Blocks"
    },
    {
      initials: "AI",
      name: "Aisha",
      role: "Grants & Federal Compliance Officer",
      track: "leadership",
      programs: ["🏛️ BFRDP", "🌾 Kellogg", "🌳 Cool Schools"],
      focus: "Coordinates non-narrative federal attachments, REEport compliance checklists, MOU tracking, and subrecipient documentation.",
      cadence: "Mon 9:00 AM Grants Sync"
    },
    {
      initials: "AN",
      name: "Annalise",
      role: "Budget & Subcontracts Financial Liaison",
      track: "leadership",
      programs: ["🏛️ BFRDP", "🌾 Kellogg", "🌳 Cool Schools"],
      focus: "Manages grant budget allocations, participant stipends, and contractor agreements (Sentli, Marcelino, Patty, Kitchen Table Consultants).",
      cadence: "Mon 9:00 AM Grants Sync"
    },
    {
      initials: "VZ",
      name: "Valdez",
      role: "8-County GIS & Spatial Mapping Analyst",
      track: "cool",
      programs: ["🏛️ BFRDP", "🌳 Cool Schools"],
      focus: "Maps beginning farmers across the 8-county Rio Grande Valley target region and supports spatial layers for the 14 Cool Schools campuses.",
      cadence: "Mon 9:00 AM Grants Sync · Tue GIS Sprint"
    },
    {
      initials: "PS",
      name: "Dr. Pushpa Soti & Dr. Carlo Moreno",
      role: "Soil Ecology, Mycorrhizae & Agroecosystem Faculty",
      track: "cool",
      programs: ["🌱 Hub & Lab", "🏛️ BFRDP", "🌳 Cool Schools"],
      focus: "Lead soil organic carbon (E-SCNE), nematode/microbial community assays, and dryland cover crop soil health diagnostics.",
      cadence: "SEEMS Soil Lab · Wed 2:00 PM Lab"
    },
    {
      initials: "VR",
      name: "Visiting Scholar (Dr. Ramos) & Grad/Undergrad Cohort",
      role: "Katie Lavallee, Samikshya Subedi, Roberto Reyna, Savannah Rugg, Matt Kutugata, Rico Marez",
      track: "cool",
      programs: ["🌳 Cool Schools", "🌱 Hub & Lab", "🌾 Kellogg", "🏛️ BFRDP"],
      focus: "Conduct field sampling, tree canopy thermal audits, silvopasture heat-stress monitoring, and bilingual community workshops.",
      cadence: "Wed 2:00 PM Lab All-Hands · Field Deployments"
    },
    {
      initials: "SP",
      name: "Sentli Center, Marcelino Garza, Patty & Kitchen Table Consultants",
      role: "Key Grant Subawardees, Farmer Mentors & Outreach Contractors",
      track: "partners",
      programs: ["🌾 Kellogg", "🏛️ BFRDP"],
      focus: "Co-host bilingual on-farm workshops, recruit Tier 1/2 beginning farmers, run Sentli transplant trainings, and deliver 1-on-1 financial benchmarking.",
      cadence: "Regional Field Workshops & Producer Mentoring"
    }
  ];

  // Default Calendar Events (Active Lab, Hub, Cool Schools & Kellogg/BFRDP milestones)
  const DEFAULT_MASTER_EVENTS = [
    {
      id: "ev-gardening-101",
      category: "KELLOGG",
      org: "Hub of Prosperity & UTRGV Agroecology",
      title: "Beginner Gardening 101 @ Hub of Prosperity Farm",
      titleEs: "Taller de Jardinería para Principiantes 101 @ Hub of Prosperity",
      dateTime: "Sat, Sep 26, 2026 @ 10:00 AM – 12:00 PM",
      dateTimeEs: "Sábado 26 de sep de 2026 @ 10:00 AM – 12:00 PM",
      location: "Hub of Prosperity Farm, 3707 W University Dr, Edinburg TX",
      assigned: "Desi Romero, Maria Gonzalez, Juan & Demetrio",
      notes: "Organic growing practices, small space/container gardening tips, native plant implementation. Conflict-free morning slot before 6:30 PM Sentli workshop.",
      conflictBadge: "✓ Split-Coverage Verified: Morning @ Hub / Evening @ Sentli",
      isDone: true,
      featured: true
    },
    {
      id: "ev-sentli-transplants",
      category: "KELLOGG",
      org: "Sentli Center & UTRGV Agroecology",
      title: "Transplant Production Workshop @ Sentli Center",
      titleEs: "Taller de Producción de Trasplantes y Plántulas @ Sentli Center",
      dateTime: "Sat, Sep 26, 2026 @ 6:30 PM",
      dateTimeEs: "Sábado 26 de sep de 2026 @ 6:30 PM",
      location: "Sentli Center, 2806 E Rogers Rd, Edinburg, TX 78542",
      assigned: "Maria Gonzalez, Patty, Sentli Staff",
      notes: "Organic transplant production, hands-on potting mix preparation, free seeds and germination tray per attendee.",
      conflictBadge: "✓ Split-Coverage Verified: Evening Slot",
      isDone: true,
      featured: true
    },
    {
      id: "ev-caceres-microforest",
      category: "COOL_SCHOOLS",
      org: "Project Cool Schools · Donna ISD & Texas Trees Foundation",
      title: "J.W. Caceres & M. Rivas Academy Microforest Planting (154 Native Trees)",
      titleEs: "Plantación de Microbosque Escolar en J.W. Caceres Academy (154 Árboles Nativos)",
      dateTime: "Mon, Sep 28, 2026 @ 8:30 AM – 12:30 PM",
      dateTimeEs: "Lunes 28 de sep de 2026 @ 8:30 AM – 12:30 PM",
      location: "J.W. Caceres Academy, Donna ISD",
      assigned: "Dr. Christoffersen, Dr. Racelis, Desi Romero, Grad Cohort",
      notes: "Flagship 154-tree schoolyard microforest installation, baseline infrared surface temp capture (122.5°F exposed vs 89.1°F shaded), and sap-flow sensor setup.",
      isDone: true,
      featured: true
    },
    {
      id: "ev-scholar-arrival",
      category: "TRAVEL",
      org: "UTRGV Agroecology Lab",
      title: "Visiting Scholar (Dr. Ramos) Arrival & Welcome Lunch with Robert Cantu",
      titleEs: "Llegada de Dra. Ramos y Almuerzo con Robert Cantu (Servicios de Alimentos UTRGV)",
      dateTime: "Tue, Sep 29, 2026 @ 10:00 AM & 12:00 PM Lunch",
      dateTimeEs: "Martes 29 de sep de 2026 @ 10:00 AM y Almuerzo 12:00 PM",
      location: "HRL Airport ➔ UTRGV Edinburg Campus Dining",
      assigned: "Dr. Alexis Racelis, Desi Romero, Visiting Scholar (Dr. Ramos)",
      notes: "Airport pickup by Desi @ 10am, followed by 12:00 PM institutional local food sourcing lunch with Robert Cantu (UTRGV Auxiliary Services).",
      isDone: true,
      featured: false
    },
    {
      id: "ev-esc1-foodshow",
      category: "WORKSHOP",
      org: "Region One ESC & UTRGV Agroecology",
      title: "Region One ESC School Nutrition Food Show",
      titleEs: "Muestra Anual de Nutrición Escolar (Region One ESC)",
      dateTime: "Wed, Sep 30, 2026 @ 8:30 AM – 2:00 PM",
      dateTimeEs: "Miércoles 30 de sep de 2026 @ 8:30 AM – 2:00 PM",
      location: "South Padre Island Convention Center",
      assigned: "Dr. Alexis Racelis, Visiting Scholar, Q / Quinn",
      notes: "120+ school nutrition booths; farm-to-school procurement outreach across South Texas ISDs.",
      isDone: true,
      featured: false
    },
    {
      id: "ev-working-lands",
      category: "BFRDP",
      org: "South Texas Grazing Land Coalition, USDA NRCS & UTRGV Agroecology",
      title: "Working Lands Subtropical Grazing & Soil Health Workshop (2-Day)",
      titleEs: "Taller de Tierras Productivas: Salud del Suelo y Pastoreo Subtropical",
      dateTime: "Thu–Fri, Oct 8–9, 2026 @ 8:00 AM Daily",
      dateTimeEs: "Jue–Vie, 8–9 de oct de 2026 @ 8:00 AM",
      location: "Day 1: Weslaco AgriLife | Day 2: La Sarra Ranch, Santa Rosa",
      assigned: "Dr. Alexis Racelis, Desi Romero, Marcelino Garza, Visiting Scholar",
      notes: "Screwworm updates, soil organic carbon, drone spraying demo, virtual fencing, and BFRDP rancher mentor panel.",
      conflictBadge: "⚡ Oct 8 Split-Coverage: Daytime @ Weslaco / 6:30 PM @ Quinta Mazatlán",
      isDone: true,
      featured: true
    },
    {
      id: "ev-planta-nativa",
      category: "COOL_SCHOOLS",
      org: "Quinta Mazatlán CUE & UTRGV Urban Forestry",
      title: "VIP Night in the Park – Planta Nativa 2026 @ Quinta Mazatlán CUE",
      titleEs: "Noche VIP en el Parque – Planta Nativa 2026 @ Quinta Mazatlán CUE",
      dateTime: "Thu, Oct 8, 2026 @ 6:30 PM – 9:30 PM",
      dateTimeEs: "Jueves 8 de oct de 2026 @ 6:30 PM – 9:30 PM",
      location: "Quinta Mazatlán Center for Urban Ecology, McAllen, TX",
      assigned: "Dr. Christoffersen, Dr. Racelis, Visiting Scholar, Grad Cohort",
      notes: "Keynote by Cyrus Harp, native tree taproot demos, student poster session, and CUE Miyawaki urban microforest outreach.",
      conflictBadge: "✓ Evening Event (Starts 6:30 PM after Working Lands Day 1)",
      isDone: true,
      featured: true
    },
    {
      id: "ev-pharr-avocado",
      category: "KELLOGG",
      org: "City of Pharr & UTRGV Agroecology",
      title: "City of Pharr Avocado Festival 2026 Community Outreach",
      titleEs: "Festival del Aguacate de Pharr 2026 – Módulo Agroecológico",
      dateTime: "Sat, Oct 10, 2026 @ 2:00 PM – 11:00 PM",
      dateTimeEs: "Sábado 10 de oct de 2026 @ 2:00 PM – 11:00 PM",
      location: "Downtown Pharr, 118 S. Cage Blvd, Pharr, TX",
      assigned: "Desi Romero, Patty, Visiting Scholar, Grad Cohort",
      notes: "Community tabling, SNAP/DUFB market outreach, and subtropical fruit tree resilience education.",
      isDone: true,
      featured: false
    },
    {
      id: "ev-econ-rowe-audit",
      category: "COOL_SCHOOLS",
      org: "Project Cool Schools · Edinburg CISD & McAllen ISD",
      title: "Economedes HS & Nikki Rowe HS Thermal & Viewshed Baseline Audit",
      titleEs: "Auditoría Térmica y de Dosel en Economedes HS y Nikki Rowe HS",
      dateTime: "Thu, Nov 12, 2026 @ 9:00 AM – 1:00 PM",
      dateTimeEs: "Jueves 12 de nov de 2026 @ 9:00 AM – 1:00 PM",
      location: "Economedes HS (Edinburg) & Nikki Rowe HS (McAllen)",
      assigned: "Dr. Christoffersen, Desi Romero, Valdez, Grad Cohort",
      notes: "Collect UAV thermal orthomosaics, classroom window Green View Score (GVS) angles, and finalize Spring 2027 planting polygons.",
      isDone: false,
      featured: true
    },
    {
      id: "ev-bfrdp-incubator-groundbreaking",
      category: "BFRDP",
      org: "USDA-NIFA BFRDP & Hub of Prosperity",
      title: "BFRDP Tier 1 Beginning Farmer Incubator Plot Groundbreaking & Drip Workshop",
      titleEs: "Inauguración de Parcelas Incubadoras BFRDP Nivel 1 y Taller de Riego por Goteo",
      dateTime: "Sat, Nov 14, 2026 @ 8:30 AM – 12:30 PM",
      dateTimeEs: "Sábado 14 de nov de 2026 @ 8:30 AM – 12:30 PM",
      location: "Hub of Prosperity Living Lab, Edinburg TX",
      assigned: "Maria Gonzalez, Juan & Demetrio, Marcelino Garza, Dr. Racelis",
      notes: "Assign quarter-acre incubator plots to Tier 1 cohort growers, demonstrate header line filtration, and seed winter brassicas.",
      isDone: false,
      featured: true
    },
    {
      id: "ev-cadence-mon",
      category: "MEETING",
      org: "Hub of Prosperity & Grants Admin",
      title: "Standing Mondays: 8am Hub Farm Ops & 9am Grants/BFRDP/Kellogg Sync",
      titleEs: "Lunes Permanentes: 8am Operaciones de Granja y 9am Sincronización de Subvenciones",
      dateTime: "Every Monday @ 8:00 AM – 10:00 AM",
      dateTimeEs: "Todos los Lunes @ 8:00 AM – 10:00 AM",
      location: "Hub of Prosperity Office & Agroecology Conference Room",
      assigned: "Maria Gonzalez, Juan & Demetrio, Dr. Racelis, Lockman, Aisha, Annalise, Valdez",
      notes: "8:00 AM field harvest & plot prep sync; 9:00 AM grant deliverables, budget, and 8-county GIS review.",
      isDone: false,
      featured: false
    },
    {
      id: "ev-cadence-wed",
      category: "MEETING",
      org: "Agroecology & Urban Forestry Labs",
      title: "Standing Wednesdays: 1pm Cool Schools · 2pm Lab All-Hands · 3:30pm Q Sprint",
      titleEs: "Miércoles Permanentes: 1pm Cool Schools · 2pm Reunión General · 3:30pm Sprint con Q",
      dateTime: "Every Wednesday @ 1:00 PM – 4:15 PM",
      dateTimeEs: "Todos los Miércoles @ 1:00 PM – 4:15 PM",
      location: "SEEMS Forestry Lab & Agroecology Main Lab",
      assigned: "Dr. Racelis, Dr. Christoffersen, Desi Romero, Q / Quinn, Visiting Scholar, Grad Cohort",
      notes: "Weekly research coordination across urban forestry, soil carbon trials, and data/manuscript sprints.",
      isDone: false,
      featured: false
    }
  ];

  // Default Team Tasks (Seeded from PROJECT_BOARD.md + Cool Schools + Kellogg/BFRDP)
  const DEFAULT_MASTER_TASKS = [
    { id: "tsk-1", title: "Process 8-county producer GIS layer & map pre-contacted farmers to BFRDP tiers", owner: "Valdez & Dr. Racelis", category: "BFRDP", due: "Nov 12, 2026", done: false },
    { id: "tsk-2", title: "Complete Economedes HS & Nikki Rowe HS classroom viewshed and thermal drone baseline", owner: "Dr. Christoffersen & Desi Romero", category: "COOL_SCHOOLS", due: "Nov 14, 2026", done: false },
    { id: "tsk-3", title: "Draft core BFRDP evaluation narrative & finalize federal REEport supporting checklist", owner: "Dr. Lockman & Aisha", category: "BFRDP", due: "Nov 18, 2026", done: false },
    { id: "tsk-4", title: "Finalize contractor agreements for Marcelino Garza, Patty & Kitchen Table Consultants", owner: "Annalise & Aisha", category: "BFRDP", due: "Nov 15, 2026", done: false },
    { id: "tsk-5", title: "Coordinate breaking ground & drip tape layout on quarter-acre plots for Tier 1 BFRDP farmers", owner: "Juan & Demetrio, Maria Gonzalez", category: "HUB", due: "Nov 14, 2026", done: false },
    { id: "tsk-6", title: "Log J.W. Caceres Academy 154-tree sap-flow & soil moisture telemetry into Cool Schools GIS", owner: "Dr. Christoffersen & Samikshya Subedi", category: "COOL_SCHOOLS", due: "Nov 16, 2026", done: true },
    { id: "tsk-7", title: "Sow Cowpea & Sunn Hemp nitrogen-building cover crop mix in Field 1 (NE & SW plots)", owner: "Maria Gonzalez, Juan & Demetrio", category: "HUB", due: "Completed", done: true },
    { id: "tsk-8", title: "Compile Fall 2026 Kellogg bilingual workshop attendance & SNAP/DUFB market survey metrics", owner: "Q / Quinn & Patty", category: "KELLOGG", due: "Nov 20, 2026", done: false },
    { id: "tsk-9", title: "Coordinate Quinta Mazatlán CUE Miyawaki native seed propagation bench at UTRGV Greenhouse", owner: "Marisol Cervantes & Dr. Christoffersen", category: "COOL_SCHOOLS", due: "Nov 22, 2026", done: false },
    { id: "tsk-10", title: "Monitor sheep thermal comfort & soil compaction in Silvopasture Zone A vs Open Pasture Zone C", owner: "Desi Romero & Roberto Reyna Oviedo", category: "HUB", due: "Ongoing Weekly", done: false }
  ];

  // Default Shared Physical Infrastructure & Fleet Assets
  const DEFAULT_SHARED_ASSETS = [
    {
      id: "asset-hub-farm",
      icon: "🌱",
      name: "Hub of Prosperity Living Lab (5 Acres)",
      specs: "15 Quarter-Acre Incubator Plots · High Tunnel · Silvopasture Zones A–C · Saturday Market Pavilion",
      status: "Available",
      custodian: "Maria Gonzalez, Juan & Demetrio",
      reservedBy: "Tier 1 BFRDP Cohort & Weekly Saturday Market (8am–12pm)",
      link: "../farm_management.html"
    },
    {
      id: "asset-mall-trailer",
      icon: "🚌",
      name: "Mobile Agroecology Learning Lab (MALL)",
      specs: "24' Enclosed Teaching Trailer · Onboard Generator · Digital Microscopes · Bilingual Display Canopy",
      status: "Available",
      custodian: "Desi Romero & Patty",
      reservedBy: "Donna ISD & McAllen CUE Schoolyard Outreach",
      link: "../wk_kellogg_foundation/dashboard.html"
    },
    {
      id: "asset-fleet-trucks",
      icon: "🛻",
      name: "Transport Fleet (2024 Ford F-250 & F-150)",
      specs: "2024 Ford F-250 Super Duty Tow Rig (MALL / Trailer Hitch) & Ford F-150 Field Work Truck",
      status: "Reserved / In Field",
      custodian: "Desi Romero & Juan",
      reservedBy: "Desi Romero — Cool Schools Sensor Audit (Economedes HS)",
      link: ""
    },
    {
      id: "asset-tractors",
      icon: "🚜",
      name: "Tractors & Field Machinery",
      specs: "John Deere 3038E Compact Utility Tractor · JD 455 No-Till Drill · BCS 853 Walk-Behind Tractor",
      status: "Available",
      custodian: "Juan & Demetrio",
      reservedBy: "Field 1 Bed Prep & BFRDP Plot Groundbreaking",
      link: "../farm_management.html"
    },
    {
      id: "asset-washpack",
      icon: "❄️",
      name: "Integrated Post-Harvest Wash-Pack & CoolBot Hub",
      specs: "40' Insulated Container · Dual-Zone CoolBot Cold Storage · Stainless Wash Sinks · 2,500-Gal Rainwater Roof",
      status: "Available",
      custodian: "Maria Gonzalez & Marisol Cervantes",
      reservedBy: "Friday Harvest Wash & Saturday Farm Stand Prep",
      link: "../farm_management.html"
    },
    {
      id: "asset-greenhouse",
      icon: "🏡",
      name: "UTRGV Certified Organic Garden & Greenhouse",
      specs: "7,500 sq ft Evaporative-Cooled Structure · 15 Raised Teaching Beds · Native Tree Propagation Tables",
      status: "Available",
      custodian: "Marisol Cervantes",
      reservedBy: "Cool Schools Native Saplings & Dining Hall Greens",
      link: ""
    },
    {
      id: "asset-seems-lab",
      icon: "🔬",
      name: "SEEMS Soil Ecology & Ecophysiology Analytical Labs",
      specs: "E-SCNE Carbon/Nitrogen Analyzer · LI-COR Porometers · Sap-Flow Loggers · UAV Thermal Camera",
      status: "Available",
      custodian: "Dr. Christoffersen, Dr. Pushpa Soti & Desi Romero",
      reservedBy: "Cool Schools Canopy Transpiration & BFRDP Soil Carbon Assays",
      link: "../campuses.html"
    }
  ];

  // ========================================================
  // 5. State Management & LocalStorage / Firestore Sync
  // ========================================================
  function getLocalJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setLocalJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`Quota warning saving ${key}:`, e);
    }
  }

  let wkkfReports = getLocalJSON('wkkf_reports', []);
  let masterLogs = getLocalJSON('master_command_logs', []);
  let coolSchoolsLogs = getLocalJSON('cool_schools_logs', []);
  let bfrdpCohort = getLocalJSON('bfrdp_cohort_roster', [
    { name: "Carlos Alvarez", tier: "Tier 1 (0–1 yr)", enterprise: "Specialty Melons & Roselle", plot: "Hub Plot 1A (1/4 Acre)", hours: "18 hrs", mentor: "Marcelino Garza / Good Grow" },
    { name: "Guadalupe Peña", tier: "Tier 1 (0–1 yr)", enterprise: "Subtropical Winter Brassicas", plot: "Hub Plot 2B (1/4 Acre)", hours: "22 hrs", mentor: "Maria Gonzalez / Hub Farm" },
    { name: "Mateo De Leon", tier: "Tier 1 (0–1 yr)", enterprise: "Pastured Poultry & Cover Crops", plot: "Hub Zone C-Pasture", hours: "14 hrs", mentor: "Servando Leal / STGLC" },
    { name: "Elena Villarreal", tier: "Tier 2 (1–3 yrs)", enterprise: "Direct CSA & Herb Cultivation", plot: "Off-site (Alamo, TX)", hours: "28 hrs (Completed)", mentor: "Katie Lavallee / Weaving Webs" },
    { name: "Ramiro Hinojosa", tier: "Tier 2 (1–3 yrs)", enterprise: "Dryland Grain Sorghum / Strip Till", plot: "Off-site (Raymondville)", hours: "26 hrs (Completed)", mentor: "Stephen Obst / Obst Farms" },
    { name: "Lucia Morales", tier: "Tier 2 (1–3 yrs)", enterprise: "High-Tunnel Heirloom Tomatoes", plot: "Hub Incubator Tunnel 1", hours: "30 hrs (Completed)", mentor: "George Bennack / Crossroads" }
  ]);
  let bfrdpContacts = getLocalJSON('bfrdp_contacts_list', []);
  let masterCalendarEvents = getLocalJSON('master_command_events', DEFAULT_MASTER_EVENTS);
  let masterTasks = getLocalJSON('master_command_tasks', DEFAULT_MASTER_TASKS);
  let sharedAssets = getLocalJSON('master_command_assets', DEFAULT_SHARED_ASSETS);

  // Ensure initial seed of masterLogs if empty so the dashboard immediately feels rich & populated
  if (!masterLogs || masterLogs.length === 0) {
    masterLogs = [...HISTORICAL_SEED_LOGS];
    setLocalJSON('master_command_logs', masterLogs);
  }

  // Clean any legacy names if present in cached events or tasks
  masterCalendarEvents = masterCalendarEvents.map(ev => ({
    ...ev,
    org: cleanText(ev.org),
    title: cleanText(ev.title),
    assigned: cleanText(ev.assigned),
    notes: cleanText(ev.notes)
  }));
  masterTasks = masterTasks.map(t => ({
    ...t,
    title: cleanText(t.title),
    owner: cleanText(t.owner)
  }));

  // ========================================================
  // 6. Unified Ledger Builder & Backfill Engine
  // ========================================================
  function getUnifiedActivityRecords() {
    const mapByKey = new Map();

    // 1. Add master_command_logs
    masterLogs.forEach(item => {
      const key = `${item.date || ''}_${(item.topic || '').toLowerCase().trim()}`;
      mapByKey.set(key, {
        id: item.id || key,
        date: item.date || '2026-10-01',
        hours: item.hours || 2.0,
        type: item.type || 'Workshop / Training',
        site: item.site || 'Hub of Prosperity Farm',
        topic: cleanText(item.topic || 'Activity Log'),
        coworkers: Array.isArray(item.coworkers) ? item.coworkers.map(cleanText) : ['Dr. Alexis Racelis', 'Desi Romero'],
        story: cleanText(item.story || ''),
        bilingual: item.bilingual !== false,
        status: item.status || 'Completed',
        programs: Array.isArray(item.programs) && item.programs.length > 0 ? item.programs : ['HUB'],
        attendees: Array.isArray(item.attendees) ? item.attendees : [],
        photoLink: item.photoLink || '',
        photos: Array.isArray(item.photos) ? item.photos : []
      });
    });

    // 2. Merge wkkf_reports from Kellogg Dashboard
    wkkfReports.forEach(r => {
      const key = `${r.date || ''}_${(r.topic || '').toLowerCase().trim()}`;
      if (mapByKey.has(key)) {
        const existing = mapByKey.get(key);
        if (!existing.programs.includes('KELLOGG')) existing.programs.push('KELLOGG');
        if ((!existing.photos || existing.photos.length === 0) && Array.isArray(r.photos) && r.photos.length > 0) {
          existing.photos = r.photos;
        }
      } else {
        mapByKey.set(key, {
          id: r.id || key,
          date: r.date || '2026-10-01',
          hours: r.hours || 2.0,
          type: r.type || 'Workshop / Training',
          site: r.site || 'Hub of Prosperity / Sentli',
          topic: cleanText(r.topic || 'Kellogg Grant Activity'),
          coworkers: Array.isArray(r.coworkers) ? r.coworkers.map(cleanText) : ['Maria Gonzalez', 'Desi Romero'],
          story: cleanText(r.story || 'Logged via W.K. Kellogg Reporting Portal.'),
          bilingual: true,
          status: r.status || 'Completed',
          programs: Array.isArray(r.programs) ? r.programs : ['KELLOGG', 'HUB'],
          attendees: Array.isArray(r.attendees) ? r.attendees : [],
          photoLink: r.photoLink || '',
          photos: Array.isArray(r.photos) ? r.photos : []
        });
      }
    });

    // 3. Merge cool_schools_logs
    coolSchoolsLogs.forEach(c => {
      const key = `${c.date || ''}_${(c.topic || '').toLowerCase().trim()}`;
      if (!mapByKey.has(key)) {
        mapByKey.set(key, {
          ...c,
          programs: Array.isArray(c.programs) ? c.programs : ['COOL_SCHOOLS', 'HUB']
        });
      }
    });

    const list = Array.from(mapByKey.values());
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return list;
  }

  async function syncAndBackfillPastEvents() {
    let addedCount = 0;
    const existingKeys = new Set(masterLogs.map(m => `${m.date}_${(m.topic || '').toLowerCase().trim()}`));

    HISTORICAL_SEED_LOGS.forEach(seed => {
      const k = `${seed.date}_${seed.topic.toLowerCase().trim()}`;
      if (!existingKeys.has(k)) {
        masterLogs.unshift(seed);
        existingKeys.add(k);
        addedCount++;
      }
    });

    // Also ensure Kellogg-tagged historical workshops are in wkkf_reports localStorage so Kellogg dashboard sees them immediately
    const wkkfKeys = new Set(wkkfReports.map(r => `${r.date}_${(r.topic || '').toLowerCase().trim()}`));
    let wkkfAdded = 0;
    HISTORICAL_SEED_LOGS.filter(s => s.programs.includes('KELLOGG')).forEach(seed => {
      const k = `${seed.date}_${seed.topic.toLowerCase().trim()}`;
      if (!wkkfKeys.has(k)) {
        const wkkfEntry = {
          date: seed.date,
          type: seed.type,
          topic: seed.topic,
          status: 'Certified / Organic Practices',
          story: seed.story,
          photoLink: seed.photoLink || '',
          photos: seed.photos || [],
          attendees: seed.attendees || []
        };
        wkkfReports.unshift(wkkfEntry);
        wkkfKeys.add(k);
        wkkfAdded++;
        if (db) {
          db.collection('wkkf_reports').doc(seed.id).set({
            ...wkkfEntry,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch(() => {});
        }
      }
    });

    setLocalJSON('master_command_logs', masterLogs);
    setLocalJSON('wkkf_reports', wkkfReports);

    if (db) {
      for (const seed of HISTORICAL_SEED_LOGS) {
        db.collection('master_command_logs').doc(seed.id).set({
          ...seed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
    }

    refreshAllMetricsAndViews();
    showToast(`Unified Ledger Synced! ${ getUnifiedActivityRecords().length } total events verified across Kellogg, BFRDP, Cool Schools & Hub.`);
  }

  const btnSyncBackfillAll = document.getElementById('btnSyncBackfillAll');
  const btnPulseBackfill = document.getElementById('btnPulseBackfill');
  if (btnSyncBackfillAll) btnSyncBackfillAll.addEventListener('click', syncAndBackfillPastEvents);
  if (btnPulseBackfill) btnPulseBackfill.addEventListener('click', syncAndBackfillPastEvents);

  // ========================================================
  // 7. Executive KPIs, Program Cards & Unified Feed (View 1)
  // ========================================================
  let currentPulseFilter = 'ALL';

  function getKelloggChecklistStats() {
    const ids = [
      'chk-j1','chk-j2','chk-j3','chk-j4','chk-j5','chk-j6',
      'chk-u1','chk-u2','chk-u3','chk-u4','chk-u5',
      'chk-s1','chk-s2','chk-s3','chk-s4','chk-s5'
    ];
    let checked = 0;
    ids.forEach(id => {
      if (localStorage.getItem(`wkkf_chk_${id}`) === 'true') checked++;
    });
    // Default baseline if none clicked yet in local browser
    if (checked === 0) checked = 9;
    return { checked, total: 16, pct: Math.round((checked / 16) * 100) };
  }

  function getBfrdpChecklistStats() {
    const saved = getLocalJSON('bfrdp_checklist_state', null);
    let checked = 0;
    const total = 20;
    if (saved && typeof saved === 'object') {
      Object.values(saved).forEach(v => { if (v === true) checked++; });
    }
    if (checked === 0) checked = 11;
    return { checked, total, pct: Math.round((checked / total) * 100) };
  }

  function getCoolSchoolsChecklistStats() {
    const chks = document.querySelectorAll('.cool-chk');
    let checked = 0;
    const total = chks.length || 12;
    chks.forEach(c => { if (c.checked) checked++; });
    const pct = Math.round((checked / total) * 100);
    return { checked, total, pct };
  }

  function renderProgramTagPills(programs) {
    const list = Array.isArray(programs) ? programs : ['HUB'];
    return list.map(p => {
      if (p === 'KELLOGG') return `<span class="tag-pill tag-kellogg">🌾 Kellogg</span>`;
      if (p === 'BFRDP') return `<span class="tag-pill tag-bfrdp">🏛️ BFRDP</span>`;
      if (p === 'COOL_SCHOOLS') return `<span class="tag-pill tag-cool">🌳 Cool Schools</span>`;
      return `<span class="tag-pill tag-hub">🌱 Hub & Lab</span>`;
    }).join(' ');
  }

  function renderUnifiedPulseFeed() {
    const container = document.getElementById('unifiedPulseFeed');
    if (!container) return;

    const allRecords = getUnifiedActivityRecords();
    const filtered = allRecords.filter(r => {
      if (currentPulseFilter === 'ALL') return true;
      return Array.isArray(r.programs) && r.programs.includes(currentPulseFilter);
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted);">No activity logs match this program filter yet.</div>`;
      return;
    }

    container.innerHTML = filtered.slice(0, 12).map(item => {
      const attCount = Array.isArray(item.attendees) ? item.attendees.length : 0;
      const coworkersStr = Array.isArray(item.coworkers) ? item.coworkers.join(', ') : (item.coworkers || 'Agroecology Team');
      const thumbHtml = (item.photos && item.photos.length > 0)
        ? `<img src="${item.photos[0]}" class="table-thumbnail" style="width:56px; height:56px;" onclick="openLightbox('${item.photos[0]}', '${(item.topic || '').replace(/'/g, "\\'")}')" alt="Photo">`
        : '';

      return `
        <div class="feed-item">
          <div class="feed-item-main">
            <div class="feed-item-header">
              <span class="feed-date">${item.date}</span>
              <span class="tag-pill" style="background:#f1f5f9; color:#334155;">${item.type || 'Event'} · ${item.hours || 2} hrs</span>
              ${renderProgramTagPills(item.programs)}
            </div>
            <div class="feed-title">${item.topic}</div>
            <div class="feed-desc">${item.story || ''}</div>
            <div class="feed-meta">
              <span>📍 ${item.site || 'Hub of Prosperity'}</span>
              <span>👥 ${attCount} Logged Attendee${attCount !== 1 ? 's' : ''}</span>
              <span>🧑‍🌾 Covered by: ${coworkersStr}</span>
            </div>
          </div>
          ${thumbHtml}
        </div>
      `;
    }).join('');
  }

  const pulseFilterBtns = document.querySelectorAll('#pulseFeedFilters .filter-pill');
  pulseFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pulseFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPulseFilter = btn.getAttribute('data-prog');
      renderUnifiedPulseFeed();
    });
  });

  // ========================================================
  // 8. Universal "Log Once" Logger & Master Workbook (View 2)
  // ========================================================
  const uDateInput = document.getElementById('u-date');
  if (uDateInput && !uDateInput.value) {
    uDateInput.value = new Date().toISOString().split('T')[0];
  }

  const btnLogToday = document.getElementById('btnLogToday');
  const btnLogYesterday = document.getElementById('btnLogYesterday');
  if (btnLogToday && uDateInput) {
    btnLogToday.addEventListener('click', () => {
      uDateInput.value = new Date().toISOString().split('T')[0];
    });
  }
  if (btnLogYesterday && uDateInput) {
    btnLogYesterday.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      uDateInput.value = d.toISOString().split('T')[0];
    });
  }

  // Auto-toggle Cool Schools routing checkbox when a Cool Schools campus or activity type is selected
  const uTypeSelect = document.getElementById('u-type');
  const uSiteSelect = document.getElementById('u-site');
  const routeCoolChk = document.getElementById('route-cool');
  function autoAdjustProgramRouting() {
    if (!routeCoolChk) return;
    const t = (uTypeSelect?.value || '').toLowerCase();
    const s = (uSiteSelect?.value || '').toLowerCase();
    if (t.includes('cool schools') || t.includes('cue') || s.includes('cool schools') || s.includes('quinta mazatl')) {
      routeCoolChk.checked = true;
    }
  }
  if (uTypeSelect) uTypeSelect.addEventListener('change', autoAdjustProgramRouting);
  if (uSiteSelect) uSiteSelect.addEventListener('change', autoAdjustProgramRouting);

  // Attendee Sub-Tabs in Logger
  const uAttendeeTabBtns = document.querySelectorAll('.attendee-tab-btn');
  const uAttendeePanels = document.querySelectorAll('.attendee-tab-panel');
  uAttendeeTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      uAttendeeTabBtns.forEach(b => b.classList.remove('active'));
      uAttendeePanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('utab-' + btn.getAttribute('data-utab'));
      if (panel) panel.classList.add('active');
    });
  });

  // Manual Attendee Table Rows
  const uAttendeeTableBody = document.querySelector('#uAttendeeTable tbody');
  const btnAddUAttendeeRow = document.getElementById('btnAddUAttendeeRow');
  function addUAttendeeRow(name = '', phone = '', email = '', org = '') {
    if (!uAttendeeTableBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="u-att-name" placeholder="Full Name" value="${name}"></td>
      <td><input type="text" class="u-att-phone" placeholder="956-555-0100" value="${phone}"></td>
      <td><input type="email" class="u-att-email" placeholder="name@email.com" value="${email}"></td>
      <td><input type="text" class="u-att-org" placeholder="Farm / School / ISD" value="${org}"></td>
      <td><button type="button" class="btn btn-secondary btn-sm" style="padding:2px 7px;" title="Remove">&times;</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => tr.remove());
    uAttendeeTableBody.appendChild(tr);
  }
  if (btnAddUAttendeeRow) {
    btnAddUAttendeeRow.addEventListener('click', () => addUAttendeeRow());
    addUAttendeeRow();
  }

  // Render BFRDP Cohort Check-In Pills in Tab 3
  function renderLoggerCohortCheckboxes() {
    const container = document.getElementById('uBfrdpCohortCheckboxes');
    if (!container) return;
    container.innerHTML = bfrdpCohort.map((farmer, idx) => `
      <label class="coworker-check-label">
        <input type="checkbox" class="u-cohort-chk" data-idx="${idx}" value="${farmer.name}">
        <span>👩‍🌾 ${farmer.name} <small style="color:var(--text-muted);">(${farmer.tier} · ${farmer.hours})</small></span>
      </label>
    `).join('');
  }

  // Client-Side Image Compression & Dropzone
  let uSelectedPhotos = [];
  const uPhotoInput = document.getElementById('u-photos');
  const uPhotoDropzone = document.getElementById('uPhotoDropzone');
  const uPhotoPreviewGrid = document.getElementById('uPhotoPreviewGrid');
  const uPhotoBatchCounter = document.getElementById('uPhotoBatchCounter');

  function compressImage(file, maxWidth = 960, maxHeight = 960, quality = 0.65) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], (file.name || 'photo').replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function renderUPhotoPreviews() {
    if (!uPhotoPreviewGrid) return;
    uPhotoPreviewGrid.innerHTML = '';
    if (uSelectedPhotos.length > 0 && uPhotoBatchCounter) {
      uPhotoBatchCounter.style.display = 'inline';
      uPhotoBatchCounter.textContent = `📸 ${uSelectedPhotos.length} photo(s) staged (~${uSelectedPhotos.length * 35} KB)`;
    } else if (uPhotoBatchCounter) {
      uPhotoBatchCounter.style.display = 'none';
    }

    uSelectedPhotos.forEach((file, idx) => {
      const div = document.createElement('div');
      div.className = 'photo-preview-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-remove-preview';
      btn.innerHTML = '&times;';
      btn.onclick = (e) => {
        e.stopPropagation();
        uSelectedPhotos.splice(idx, 1);
        renderUPhotoPreviews();
      };
      div.appendChild(img);
      div.appendChild(btn);
      uPhotoPreviewGrid.appendChild(div);
    });
  }

  if (uPhotoInput) {
    uPhotoInput.addEventListener('change', (e) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach(f => {
          if (f.type.startsWith('image/')) uSelectedPhotos.push(f);
        });
        renderUPhotoPreviews();
      }
    });
  }

  if (uPhotoDropzone) {
    ['dragenter', 'dragover'].forEach(ev => {
      uPhotoDropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        uPhotoDropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      uPhotoDropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        uPhotoDropzone.classList.remove('dragover');
      });
    });
    uPhotoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files) {
        Array.from(e.dataTransfer.files).forEach(f => {
          if (f.type.startsWith('image/')) uSelectedPhotos.push(f);
        });
        renderUPhotoPreviews();
      }
    });
  }

  // Handle Universal Logger Form Submission ("Log Once, Count Everywhere")
  const universalLoggerForm = document.getElementById('universalLoggerForm');
  if (universalLoggerForm) {
    universalLoggerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitUniversalLog');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Syncing Across Grants...';
      }

      const dateVal = document.getElementById('u-date')?.value || new Date().toISOString().split('T')[0];
      const hoursVal = parseFloat(document.getElementById('u-hours')?.value || '2.0') || 2.0;
      const typeVal = document.getElementById('u-type')?.value || 'Workshop / Training';
      const siteVal = document.getElementById('u-site')?.value || 'Hub of Prosperity Farm';
      const topicVal = document.getElementById('u-topic')?.value.trim() || 'Agroecology Activity';
      const storyVal = document.getElementById('u-story')?.value.trim() || '';
      const bilingualVal = document.getElementById('u-bilingual')?.checked !== false;
      const statusVal = document.getElementById('u-status')?.value || 'Completed';
      const rawPhotoLink = document.getElementById('u-photo-link')?.value.trim() || '';

      // Selected coworkers
      const coworkers = [];
      document.querySelectorAll('#uCoworkerPills input[type="checkbox"]:checked').forEach(chk => {
        coworkers.push(chk.value);
      });

      // Selected programs
      const programs = [];
      if (document.getElementById('route-kellogg')?.checked) programs.push('KELLOGG');
      if (document.getElementById('route-bfrdp')?.checked) programs.push('BFRDP');
      if (document.getElementById('route-cool')?.checked) programs.push('COOL_SCHOOLS');
      if (document.getElementById('route-hub')?.checked || programs.length === 0) programs.push('HUB');

      // Gather Attendees from all 3 tabs (Manual + Bulk + Checked BFRDP Cohort)
      const attendees = [];
      if (uAttendeeTableBody) {
        uAttendeeTableBody.querySelectorAll('tr').forEach(tr => {
          const n = tr.querySelector('.u-att-name')?.value.trim();
          if (n) {
            attendees.push({
              name: n,
              phone: tr.querySelector('.u-att-phone')?.value.trim() || '',
              email: tr.querySelector('.u-att-email')?.value.trim() || '',
              location: tr.querySelector('.u-att-org')?.value.trim() || siteVal
            });
          }
        });
      }

      const bulkText = document.getElementById('u-bulk-attendees')?.value.trim() || '';
      if (bulkText) {
        bulkText.split('\n').forEach(line => {
          const cols = line.split('\t');
          if (cols[0] && cols[0].trim()) {
            attendees.push({
              name: cols[0].trim(),
              phone: cols[1] ? cols[1].trim() : '',
              email: cols[2] ? cols[2].trim() : '',
              location: cols[3] ? cols[3].trim() : siteVal
            });
          }
        });
      }

      // Check BFRDP Cohort Check-In & increment their instructional hours!
      let cohortUpdatedCount = 0;
      document.querySelectorAll('.u-cohort-chk:checked').forEach(chk => {
        const idx = parseInt(chk.getAttribute('data-idx'), 10);
        const farmer = bfrdpCohort[idx];
        if (farmer) {
          attendees.push({
            name: farmer.name,
            phone: '',
            email: '',
            location: `${farmer.tier} · ${farmer.plot}`
          });
          const currentHrs = parseFloat(farmer.hours) || 0;
          const newHrs = currentHrs + hoursVal;
          farmer.hours = `${newHrs} hrs${newHrs >= 25 ? ' (Completed)' : ''}`;
          cohortUpdatedCount++;
        }
      });

      // Process & Compress Photos
      const uploadedPhotos = [];
      const progBox = document.getElementById('uUploadProgressBox');
      const progFill = document.getElementById('uUploadProgressFill');
      const progText = document.getElementById('uUploadProgressText');

      if (uSelectedPhotos.length > 0 && progBox) {
        progBox.style.display = 'block';
        for (let i = 0; i < uSelectedPhotos.length; i++) {
          const pct = Math.round(((i + 1) / uSelectedPhotos.length) * 90);
          if (progFill) progFill.style.width = `${pct}%`;
          if (progText) progText.textContent = `Compressing & uploading photo ${i + 1} of ${uSelectedPhotos.length}...`;
          try {
            const compressed = await compressImage(uSelectedPhotos[i], 960, 960, 0.65);
            const b64 = await readFileAsDataUrl(compressed);
            uploadedPhotos.push(b64);
          } catch (err) {
            console.warn('Photo compression fallback:', err);
          }
        }
      }

      const masterEntry = {
        id: 'log-' + Date.now(),
        date: dateVal,
        hours: hoursVal,
        type: typeVal,
        site: siteVal,
        topic: topicVal,
        coworkers: coworkers.length > 0 ? coworkers : ['Dr. Alexis Racelis'],
        story: storyVal,
        bilingual: bilingualVal,
        status: statusVal,
        programs: programs,
        attendees: attendees,
        photoLink: rawPhotoLink || (uploadedPhotos[0] || ''),
        photos: uploadedPhotos
      };

      // 1. Always save to Master Command Logs
      masterLogs.unshift(masterEntry);
      setLocalJSON('master_command_logs', masterLogs);
      if (db) {
        db.collection('master_command_logs').add({
          ...masterEntry,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.warn('master_command_logs sync warning:', err));
      }

      // 2. Route to W.K. Kellogg Foundation (`wkkf_reports`) if checked
      if (programs.includes('KELLOGG')) {
        const wkkfRecord = {
          date: dateVal,
          type: typeVal,
          topic: `${topicVal} (${siteVal})`,
          status: statusVal,
          story: `${storyVal} [Covered by: ${masterEntry.coworkers.join(', ')}]`,
          photoLink: masterEntry.photoLink,
          photos: uploadedPhotos,
          attendees: attendees
        };
        wkkfReports.unshift(wkkfRecord);
        setLocalJSON('wkkf_reports', wkkfReports);
        if (db) {
          db.collection('wkkf_reports').add({
            ...wkkfRecord,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(err => console.warn('wkkf_reports sync warning:', err));
        }
      }

      // 3. Route to USDA-NIFA BFRDP (`bfrdp_data/cohort` & `bfrdp_data/contacts`) if checked
      if (programs.includes('BFRDP')) {
        if (cohortUpdatedCount > 0) {
          setLocalJSON('bfrdp_cohort_roster', bfrdpCohort);
          renderLoggerCohortCheckboxes();
          if (db) {
            db.collection('bfrdp_data').doc('cohort').set({
              roster: bfrdpCohort,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
        }
        // Also add any new manual attendees to BFRDP 8-County Contacts CRM if not already present
        if (attendees.length > 0) {
          const existingNames = new Set(bfrdpContacts.map(c => (c.name || '').toLowerCase().trim()));
          let newContactAdded = false;
          attendees.forEach(att => {
            const cleanName = (att.name || '').trim();
            if (cleanName && !existingNames.has(cleanName.toLowerCase())) {
              bfrdpContacts.unshift({
                name: cleanName,
                title: "Workshop Participant",
                org: att.location || siteVal,
                county: "Hidalgo / Regional",
                category: "farmer",
                status: "active",
                info: att.email || att.phone || "Logged via Command Center",
                role: `Attended: ${topicVal}`
              });
              existingNames.add(cleanName.toLowerCase());
              newContactAdded = true;
            }
          });
          if (newContactAdded) {
            setLocalJSON('bfrdp_contacts_list', bfrdpContacts);
            if (db) {
              db.collection('bfrdp_data').doc('contacts').set({
                list: bfrdpContacts,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true }).catch(() => {});
            }
          }
        }
      }

      // 4. Route to Project Cool Schools (`cool_schools_logs`) if checked
      if (programs.includes('COOL_SCHOOLS')) {
        coolSchoolsLogs.unshift(masterEntry);
        setLocalJSON('cool_schools_logs', coolSchoolsLogs);
        if (db) {
          db.collection('cool_schools_logs').add({
            ...masterEntry,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(() => {});
        }
      }

      // Reset form state
      if (progBox) progBox.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Log Event & Sync Across Selected Programs';
      }
      document.getElementById('u-topic').value = '';
      document.getElementById('u-story').value = '';
      document.getElementById('u-bulk-attendees').value = '';
      document.getElementById('u-photo-link').value = '';
      uSelectedPhotos = [];
      renderUPhotoPreviews();
      if (uAttendeeTableBody) {
        uAttendeeTableBody.innerHTML = '';
        addUAttendeeRow();
      }
      document.querySelectorAll('.u-cohort-chk:checked').forEach(c => { c.checked = false; });

      refreshAllMetricsAndViews();
      showToast(`Logged "${topicVal}"! Routed to: ${programs.join(', ')}${cohortUpdatedCount ? ` (+${hoursVal} hrs added to ${cohortUpdatedCount} BFRDP farmer records)` : ''}.`);
    });
  }

  const btnClearLoggerForm = document.getElementById('btnClearLoggerForm');
  if (btnClearLoggerForm && universalLoggerForm) {
    btnClearLoggerForm.addEventListener('click', () => {
      universalLoggerForm.reset();
      if (uDateInput) uDateInput.value = new Date().toISOString().split('T')[0];
      uSelectedPhotos = [];
      renderUPhotoPreviews();
    });
  }

  // Render Master Activity Workbook Grid
  function renderMasterWorkbookGrid() {
    const tbody = document.getElementById('masterWorkbookBody');
    const countSpan = document.getElementById('workbookRecordCount');
    if (!tbody) return;

    const progFilter = document.getElementById('workbookFilterProgram')?.value || 'ALL';
    const seasonFilter = document.getElementById('workbookFilterSeason')?.value || 'all';
    const query = (document.getElementById('workbookSearchInput')?.value || '').toLowerCase().trim();

    const allRecords = getUnifiedActivityRecords();
    const filtered = allRecords.filter(r => {
      const matchProg = progFilter === 'ALL' || (Array.isArray(r.programs) && r.programs.includes(progFilter));
      const matchSeason = seasonFilter === 'all' || getSeasonFromDate(r.date) === seasonFilter;
      const hay = `${r.topic} ${r.site} ${r.story} ${(r.coworkers || []).join(' ')}`.toLowerCase();
      const matchQuery = !query || hay.includes(query);
      return matchProg && matchSeason && matchQuery;
    });

    if (countSpan) countSpan.textContent = `${filtered.length} Record${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No matching activity records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const attCount = Array.isArray(r.attendees) ? r.attendees.length : 0;
      const attNames = Array.isArray(r.attendees) ? r.attendees.map(a => a.name).filter(Boolean).join(', ') : '';
      const coworkersList = Array.isArray(r.coworkers) ? r.coworkers.join(', ') : (r.coworkers || 'Team');

      let photoHtml = `<span style="color:var(--text-muted); font-size:0.78rem;">None</span>`;
      if (Array.isArray(r.photos) && r.photos.length > 0) {
        photoHtml = `<div class="table-photo-gallery">` + r.photos.map(url =>
          `<img src="${url}" class="table-thumbnail" onclick="openLightbox('${url}', '${(r.topic || '').replace(/'/g, "\\'")}')" alt="Photo">`
        ).join('') + `</div>`;
      } else if (r.photoLink) {
        photoHtml = `<a href="${r.photoLink}" target="_blank" style="font-size:0.78rem; font-weight:700; color:var(--primary-mid);">📁 View Media</a>`;
      }

      return `
        <tr>
          <td>
            <strong>${r.date}</strong>
            <div style="font-size:0.72rem; color:var(--text-muted);">${r.hours || 2.0} hrs · ${r.status || 'Completed'}</div>
          </td>
          <td><div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">${renderProgramTagPills(r.programs)}</div></td>
          <td>
            <strong>${r.type || 'Workshop'}</strong>
            <div style="font-size:0.76rem; color:var(--text-secondary);">📍 ${r.site || 'Hub of Prosperity'}</div>
          </td>
          <td style="max-width:310px;">
            <div style="font-weight:700; color:var(--text-primary);">${r.topic}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:3px;">${r.story || ''}</div>
          </td>
          <td style="font-size:0.79rem; font-weight:600; color:var(--primary-mid);">${coworkersList}</td>
          <td>
            <strong>👤 ${attCount} Logged</strong>
            <div style="font-size:0.73rem; color:var(--text-muted); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${attNames}">${attNames || 'Group Attendance'}</div>
          </td>
          <td>${photoHtml}</td>
        </tr>
      `;
    }).join('');
  }

  ['workbookFilterProgram', 'workbookFilterSeason', 'workbookSearchInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', renderMasterWorkbookGrid);
      el.addEventListener('change', renderMasterWorkbookGrid);
    }
  });

  // Export Master CSV
  const btnExportMasterCsv = document.getElementById('btnExportMasterCsv');
  if (btnExportMasterCsv) {
    btnExportMasterCsv.addEventListener('click', () => {
      const records = getUnifiedActivityRecords();
      let csv = 'Date,Hours,Programs,Activity Type,Site/Campus,Topic,Coworkers Covered,Attendee Count,Attendee Names,What Was Taught / Takeaways\n';
      records.forEach(r => {
        const progs = (r.programs || []).join(' | ');
        const cows = (r.coworkers || []).join('; ');
        const attCount = (r.attendees || []).length;
        const attNames = (r.attendees || []).map(a => a.name).join('; ');
        const row = [
          `"${r.date || ''}"`,
          r.hours || 2,
          `"${progs}"`,
          `"${(r.type || '').replace(/"/g, '""')}"`,
          `"${(r.site || '').replace(/"/g, '""')}"`,
          `"${(r.topic || '').replace(/"/g, '""')}"`,
          `"${cows.replace(/"/g, '""')}"`,
          attCount,
          `"${attNames.replace(/"/g, '""')}"`,
          `"${(r.story || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master_Agroecology_Command_Workbook_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('Exported Master Activity Workbook CSV!');
    });
  }

  // ========================================================
  // 9. Master Calendar, Sub-Views & WhatsApp Digest (View 3)
  // ========================================================
  let calCategoryFilter = 'ALL';
  let calMemberFilter = 'ALL';
  let waLang = 'EN';

  function renderMasterCalendar() {
    const cardsGrid = document.getElementById('masterCalendarCardsGrid');
    if (!cardsGrid) return;

    const filtered = masterCalendarEvents.filter(ev => {
      const matchCat = calCategoryFilter === 'ALL' || ev.category === calCategoryFilter;
      const hay = `${ev.assigned || ''} ${ev.title || ''} ${ev.org || ''}`.toLowerCase();
      const matchMem = calMemberFilter === 'ALL' || hay.includes(calMemberFilter.toLowerCase());
      return matchCat && matchMem;
    });

    if (filtered.length === 0) {
      cardsGrid.innerHTML = `<div style="grid-column:1/-1; padding:2rem; text-align:center; color:var(--text-muted);">No events match the selected category and coworker filters.</div>`;
    } else {
      cardsGrid.innerHTML = filtered.map(ev => {
        const tagClass = ev.category === 'COOL_SCHOOLS' ? 'tag-cool' :
                         ev.category === 'KELLOGG' ? 'tag-kellogg' :
                         ev.category === 'BFRDP' ? 'tag-bfrdp' :
                         ev.category === 'TRAVEL' ? 'tag-travel' : 'tag-hub';
        const titleText = (waLang === 'ES' && ev.titleEs) ? ev.titleEs : ev.title;
        const dateText = (waLang === 'ES' && ev.dateTimeEs) ? ev.dateTimeEs : ev.dateTime;

        return `
          <div class="event-card ${ev.featured ? 'featured' : ''} ${ev.isDone ? 'done' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="tag-pill ${tagClass}">${ev.category.replace('_', ' ')}</span>
              <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${ev.isDone ? '✓ Completed' : '📅 Scheduled'}</span>
            </div>
            <div style="font-size:1rem; font-weight:800; color:var(--text-primary);">${titleText}</div>
            <div style="font-size:0.82rem; font-weight:700; color:var(--primary-mid);">🕒 ${dateText}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">📍 ${ev.location || 'Hub of Prosperity'}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">🧑‍🌾 <strong>Coverage:</strong> ${ev.assigned || 'Agroecology Team'}</div>
            ${ev.conflictBadge ? `<div style="font-size:0.74rem; font-weight:700; padding:4px 8px; border-radius:6px; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;">${ev.conflictBadge}</div>` : ''}
            <div style="font-size:0.79rem; color:var(--text-muted); margin-top:auto; padding-top:6px; border-top:1px solid var(--border-light);">${ev.notes || ''}</div>
          </div>
        `;
      }).join('');
    }

    // Render Monthly Grid (Oct / Nov 2026)
    const monthGrid = document.getElementById('masterMonthGrid');
    if (monthGrid) {
      const daysHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('');
      const sampleCells = [
        { day: '26 Sep', highlight: true, pills: [{ txt: '10am Hub Gardening 101', cls: 'workshop' }, { txt: '6:30pm Sentli Transplants', cls: 'workshop' }] },
        { day: '28 Sep', highlight: true, pills: [{ txt: '8:30am Caceres 154 Trees', cls: 'cool' }, { txt: '9am Grants Sync', cls: 'meeting' }] },
        { day: '29 Sep', highlight: false, pills: [{ txt: '10am Scholar Arrival', cls: '' }, { txt: '12pm Robert Cantu Lunch', cls: 'meeting' }] },
        { day: '30 Sep', highlight: true, pills: [{ txt: '8:30am SPI Food Show', cls: 'workshop' }, { txt: '1pm Cool Schools · 2pm Lab', cls: 'meeting' }] },
        { day: '5 Oct', highlight: false, pills: [{ txt: '8am Hub Ops · 9am Grants', cls: 'meeting' }] },
        { day: '7 Oct', highlight: false, pills: [{ txt: '1pm Cool Schools · 2pm Lab', cls: 'meeting' }] },
        { day: '8 Oct', highlight: true, pills: [{ txt: '8am Working Lands D1', cls: 'workshop' }, { txt: '6:30pm Planta Nativa CUE', cls: 'cool' }] },
        { day: '9 Oct', highlight: true, pills: [{ txt: '8am Working Lands D2 Ranch', cls: 'workshop' }] },
        { day: '10 Oct', highlight: true, pills: [{ txt: '2pm Pharr Avocado Fest', cls: 'workshop' }] },
        { day: '14 Oct', highlight: false, pills: [{ txt: '1pm Cool Schools · 2pm Lab', cls: 'meeting' }] },
        { day: '21 Oct', highlight: false, pills: [{ txt: '1pm Cool Schools · 2pm Lab', cls: 'meeting' }] },
        { day: '29 Oct', highlight: false, pills: [{ txt: '9am Scholar Closeout', cls: '' }] },
        { day: '12 Nov', highlight: true, pills: [{ txt: '9am Economedes & Rowe Audit', cls: 'cool' }] },
        { day: '14 Nov', highlight: true, pills: [{ txt: '8:30am BFRDP Plot Groundbreaking', cls: 'workshop' }] }
      ];
      monthGrid.innerHTML = daysHeader + sampleCells.map(c => `
        <div class="cal-cell ${c.highlight ? 'highlight' : ''}">
          <div class="cal-cell-num"><span>${c.day}</span></div>
          ${c.pills.map(p => `<div class="cal-Mini-pill ${p.cls}">${p.txt}</div>`).join('')}
        </div>
      `).join('');
    }

    // Render Seasonal Horizon (Summer 2026 – Fall 2027)
    const horizonGrid = document.getElementById('seasonalHorizonGrid');
    if (horizonGrid) {
      horizonGrid.innerHTML = `
        <div class="card-panel" style="margin-bottom:0;">
          <h4 style="font-size:0.98rem; font-weight:800; color:var(--primary-mid); margin-bottom:0.6rem;">☀️ Fall 2026 (Current Active Window)</h4>
          <ul class="checklist-box">
            <li>✅ <strong>Sept 26:</strong> Hub Gardening 101 &amp; Sentli Transplant Workshops</li>
            <li>✅ <strong>Sept 28:</strong> J.W. Caceres Academy 154-Tree Cool Schools Planting</li>
            <li>✅ <strong>Oct 8–10:</strong> Working Lands Workshop, Quinta Mazatlán Planta Nativa &amp; Pharr Avocado Fest</li>
            <li>📅 <strong>Nov 12–14:</strong> Economedes/Rowe Thermal Audits &amp; BFRDP Tier 1 Plot Groundbreaking</li>
          </ul>
        </div>
        <div class="card-panel" style="margin-bottom:0;">
          <h4 style="font-size:0.98rem; font-weight:800; color:var(--primary-mid); margin-bottom:0.6rem;">❄️ Winter 2026 / Spring 2027</h4>
          <ul class="checklist-box">
            <li>🌱 <strong>Dec 2026:</strong> Winter Brassica Harvest &amp; Farm-to-Family Food Festival #1</li>
            <li>🌳 <strong>Jan–Feb 2027:</strong> Cool Schools Phase 2 Planting (Economedes HS, Nikki Rowe HS &amp; La Joya ISD)</li>
            <li>🏛️ <strong>Mar 2027:</strong> BFRDP Bilingual Business &amp; Kitchen Table Financial Benchmarking Cohort</li>
          </ul>
        </div>
        <div class="card-panel" style="margin-bottom:0;">
          <h4 style="font-size:0.98rem; font-weight:800; color:var(--primary-mid); margin-bottom:0.6rem;">🌾 Summer – Fall 2027</h4>
          <ul class="checklist-box">
            <li>☀️ <strong>Jun–Jul 2027:</strong> Peak Summer Heat Stress &amp; Schoolyard Canopy Transpiration Telemetry</li>
            <li>🎓 <strong>Aug 2027:</strong> Kellogg 20+ Participant UTRGV Certificate Graduation &amp; Final Report</li>
            <li>🚜 <strong>Sept 2027:</strong> BFRDP Year 2 Cohort Expansion &amp; 8-County Producer Symposium</li>
          </ul>
        </div>
      `;
    }
  }

  // Subview switcher buttons
  const calSubviewBtns = document.querySelectorAll('.cal-subview-btn');
  calSubviewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      calSubviewBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--primary-mid)';
      btn.style.color = '#fff';
      const mode = btn.getAttribute('data-calview');
      document.getElementById('calSubviewCards').style.display = mode === 'cards' ? 'block' : 'none';
      document.getElementById('calSubviewMonth').style.display = mode === 'month' ? 'block' : 'none';
      document.getElementById('calSubviewHorizon').style.display = mode === 'horizon' ? 'block' : 'none';
    });
  });

  // Category & Coworker filters on Calendar
  document.querySelectorAll('#calCategoryFilters .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#calCategoryFilters .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calCategoryFilter = btn.getAttribute('data-cat');
      renderMasterCalendar();
    });
  });

  document.querySelectorAll('#calCoworkerFilters .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#calCoworkerFilters .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calMemberFilter = btn.getAttribute('data-member');
      renderMasterCalendar();
    });
  });

  // Language toggle & WhatsApp Copy Digest
  const btnToggleWaLang = document.getElementById('btnToggleWaLang');
  const waLangLabel = document.getElementById('waLangLabel');
  if (btnToggleWaLang) {
    btnToggleWaLang.addEventListener('click', () => {
      waLang = waLang === 'EN' ? 'ES' : 'EN';
      if (waLangLabel) waLangLabel.textContent = waLang;
      renderMasterCalendar();
    });
  }

  const btnCopyWhatsAppDigest = document.getElementById('btnCopyWhatsAppDigest');
  if (btnCopyWhatsAppDigest) {
    btnCopyWhatsAppDigest.addEventListener('click', () => {
      const header = waLang === 'ES'
        ? `🌿 *CENTRO DE COMANDO AGROECOLOGÍA UTRGV Y HUB OF PROSPERITY — RESUMEN SEMANAL*\n`
        : `🌿 *UTRGV AGROECOLOGY & HUB COMMAND CENTER — WEEKLY TEAM DIGEST*\n`;
      const cadence = waLang === 'ES'
        ? `\n🔄 *CADENCIA SEMANAL:*\n• Lun 8am: Operaciones Granja Hub (María, Juan y Demetrio)\n• Lun 9am: Sincronización Subvenciones Kellogg/BFRDP (Dr. Racelis, Lockman, Aisha, Annalise, Valdez)\n• Mar 9am: Bloque Docente Dr. Racelis\n• Mié 1pm: Cool Schools (Dr. Christoffersen) · 2pm Laboratorio General · 3:30pm Sprint Q\n\n📅 *EVENTOS DESTACADOS:*\n`
        : `\n🔄 *STANDING WEEKLY CADENCE:*\n• Mon 8am: Hub Farm Ops (Maria, Juan & Demetrio)\n• Mon 9am: Grants, BFRDP & Kellogg Sync (Dr. Racelis, Lockman, Aisha, Annalise, Valdez)\n• Tue 9am: Dr. Racelis Teaching Block\n• Wed 1pm: Cool Schools (Dr. Christoffersen) · 2pm Lab All-Hands · 3:30pm Q Sprint\n\n📅 *KEY EVENTS & COVERAGE:*\n`;

      const lines = masterCalendarEvents.slice(0, 8).map(ev => {
        const t = (waLang === 'ES' && ev.titleEs) ? ev.titleEs : ev.title;
        const d = (waLang === 'ES' && ev.dateTimeEs) ? ev.dateTimeEs : ev.dateTime;
        return `• *${t}* (${d}) — 📍 ${ev.location} | 👥 ${ev.assigned}`;
      }).join('\n');

      const text = header + cadence + lines;
      navigator.clipboard.writeText(text).then(() => {
        showToast(waLang === 'ES' ? '¡Resumen en Español copiado para WhatsApp!' : 'Weekly Digest copied to clipboard for WhatsApp!');
      });
    });
  }

  // Post New Event Modal
  const postEventModal = document.getElementById('postEventModal');
  const btnOpenPostEventModal = document.getElementById('btnOpenPostEventModal');
  const btnClosePostEventModal = document.getElementById('btnClosePostEventModal');
  const btnCancelPostEventModal = document.getElementById('btnCancelPostEventModal');
  const postEventForm = document.getElementById('postEventForm');

  if (btnOpenPostEventModal && postEventModal) {
    btnOpenPostEventModal.addEventListener('click', () => postEventModal.classList.add('active'));
  }
  [btnClosePostEventModal, btnCancelPostEventModal].forEach(b => {
    if (b && postEventModal) b.addEventListener('click', () => postEventModal.classList.remove('active'));
  });

  if (postEventForm) {
    postEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newEv = {
        id: 'ev-' + Date.now(),
        category: document.getElementById('evCategory').value,
        dateTime: document.getElementById('evDateTime').value.trim(),
        title: cleanText(document.getElementById('evTitle').value.trim()),
        location: document.getElementById('evLocation').value.trim(),
        org: cleanText(document.getElementById('evOrg').value.trim() || 'UTRGV Agroecology'),
        assigned: cleanText(document.getElementById('evAssigned').value.trim()),
        notes: cleanText(document.getElementById('evNotes').value.trim()),
        isDone: false,
        featured: true
      };
      masterCalendarEvents.unshift(newEv);
      setLocalJSON('master_command_events', masterCalendarEvents);
      if (db) {
        db.collection('master_command_events').add({
          ...newEv,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
      }
      renderMasterCalendar();
      postEventModal.classList.remove('active');
      postEventForm.reset();
      showToast(`Posted "${newEv.title}" to Master Calendar!`);
    });
  }

  // ========================================================
  // 10. Coworker Directory & Interactive Task Board (View 4)
  // ========================================================
  let currentCoworkerTrack = 'ALL';
  let currentTaskCat = 'ALL';

  function renderCoworkersDirectory() {
    const container = document.getElementById('coworkerCardsContainer');
    if (!container) return;

    const filtered = COWORKER_DIRECTORY.filter(c => currentCoworkerTrack === 'ALL' || c.track === currentCoworkerTrack);
    container.innerHTML = filtered.map(c => `
      <div class="coworker-card">
        <div class="coworker-top">
          <div class="coworker-avatar">${c.initials}</div>
          <div>
            <div class="coworker-name">${c.name}</div>
            <div class="coworker-role">${c.role}</div>
          </div>
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          ${c.programs.map(p => `<span class="tag-pill" style="background:#f1f5f9; color:#1e293b; font-size:0.68rem;">${p}</span>`).join('')}
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary);">${c.focus}</p>
        <div style="margin-top:auto; padding-top:0.5rem; border-top:1px solid var(--border-light); font-size:0.74rem; font-weight:600; color:var(--primary-mid);">
          🕒 ${c.cadence}
        </div>
      </div>
    `).join('');
  }

  document.querySelectorAll('#coworkerTrackFilters .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#coworkerTrackFilters .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCoworkerTrack = btn.getAttribute('data-track');
      renderCoworkersDirectory();
    });
  });

  function renderTeamTaskBoard() {
    const listEl = document.getElementById('teamTaskBoardList');
    const countEl = document.getElementById('taskBoardCount');
    const hubTaskEl = document.getElementById('pulseHubTasksCount');
    if (!listEl) return;

    const openTotal = masterTasks.filter(t => !t.done).length;
    if (countEl) countEl.textContent = `${openTotal} Open`;
    if (hubTaskEl) hubTaskEl.textContent = `${openTotal} Open`;

    const filtered = masterTasks.filter(t => currentTaskCat === 'ALL' || t.category === currentTaskCat);
    listEl.innerHTML = filtered.map((t) => {
      const catBadge = t.category === 'COOL_SCHOOLS' ? `<span class="tag-pill tag-cool">🌳 Cool Schools</span>` :
                       t.category === 'KELLOGG' ? `<span class="tag-pill tag-kellogg">🌾 Kellogg</span>` :
                       t.category === 'BFRDP' ? `<span class="tag-pill tag-bfrdp">🏛️ BFRDP & GIS</span>` :
                       `<span class="tag-pill tag-hub">🚜 Hub Field</span>`;
      return `
        <div class="task-row ${t.done ? 'completed' : ''}">
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;">
            <input type="checkbox" class="task-toggle-chk" data-id="${t.id}" ${t.done ? 'checked' : ''} style="width:17px; height:17px; accent-color:var(--primary-mid);">
            <div>
              <div class="task-title-text" style="font-size:0.86rem; font-weight:700; color:var(--text-primary);">${t.title}</div>
              <div style="font-size:0.76rem; color:var(--text-secondary);">👤 <strong>Owner:</strong> ${t.owner} · 📅 <strong>Target:</strong> ${t.due || 'Active Sprint'}</div>
            </div>
          </label>
          ${catBadge}
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.task-toggle-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-id');
        const found = masterTasks.find(x => x.id === id);
        if (found) {
          found.done = chk.checked;
          setLocalJSON('master_command_tasks', masterTasks);
          if (db) {
            db.collection('master_command_tasks').doc('board').set({
              tasks: masterTasks,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
          renderTeamTaskBoard();
          refreshAllMetricsAndViews();
        }
      });
    });
  }

  document.querySelectorAll('#taskCategoryFilters .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#taskCategoryFilters .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTaskCat = btn.getAttribute('data-taskcat');
      renderTeamTaskBoard();
    });
  });

  // Assign New Task Modal
  const assignTaskModal = document.getElementById('assignTaskModal');
  const btnOpenAssignTaskModal = document.getElementById('btnOpenAssignTaskModal');
  const btnCloseAssignTaskModal = document.getElementById('btnCloseAssignTaskModal');
  const btnCancelAssignTaskModal = document.getElementById('btnCancelAssignTaskModal');
  const assignTaskForm = document.getElementById('assignTaskForm');

  if (btnOpenAssignTaskModal && assignTaskModal) {
    btnOpenAssignTaskModal.addEventListener('click', () => assignTaskModal.classList.add('active'));
  }
  [btnCloseAssignTaskModal, btnCancelAssignTaskModal].forEach(b => {
    if (b && assignTaskModal) b.addEventListener('click', () => assignTaskModal.classList.remove('active'));
  });

  if (assignTaskForm) {
    assignTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newTask = {
        id: 'tsk-' + Date.now(),
        title: cleanText(document.getElementById('tskTitle').value.trim()),
        owner: cleanText(document.getElementById('tskOwner').value.trim()),
        category: document.getElementById('tskCategory').value,
        due: document.getElementById('tskDue').value.trim() || 'Upcoming Sprint',
        done: false
      };
      masterTasks.unshift(newTask);
      setLocalJSON('master_command_tasks', masterTasks);
      if (db) {
        db.collection('master_command_tasks').doc('board').set({
          tasks: masterTasks,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
      renderTeamTaskBoard();
      refreshAllMetricsAndViews();
      assignTaskModal.classList.remove('active');
      assignTaskForm.reset();
      showToast(`Assigned task to ${newTask.owner}!`);
    });
  }

  // ========================================================
  // 11. Project Cool Schools & 14-Campus Directory (View 5)
  // ========================================================
  const coolCheckboxes = document.querySelectorAll('.cool-chk');
  const savedCoolState = getLocalJSON('cool_schools_checklist_state', null);
  if (savedCoolState && typeof savedCoolState === 'object') {
    coolCheckboxes.forEach(chk => {
      if (typeof savedCoolState[chk.id] === 'boolean') {
        chk.checked = savedCoolState[chk.id];
      }
    });
  }

  coolCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      const state = {};
      coolCheckboxes.forEach(c => { state[c.id] = c.checked; });
      setLocalJSON('cool_schools_checklist_state', state);
      if (db) {
        db.collection('cool_schools_data').doc('checklist').set({
          state,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
      refreshAllMetricsAndViews();
      showToast('Cool Schools deliverable progress updated!');
    });
  });

  window.launchCoolCampusModel = function(campusId, targetPage) {
    const chosen = COOL_SCHOOLS_CAMPUSES.find(c => c.id === campusId);
    if (chosen) {
      localStorage.setItem('activeCampusId', chosen.id);
      localStorage.setItem('activeCampusName', chosen.name);
      localStorage.setItem('activeCampusLng', chosen.coords[0]);
      localStorage.setItem('activeCampusLat', chosen.coords[1]);
    }
    window.location.href = targetPage || '../campuses.html';
  };

  function renderCoolSchoolsCampusesGrid() {
    const grid = document.getElementById('coolCampusesGrid');
    if (!grid) return;
    const distFilter = document.getElementById('coolDistrictFilter')?.value || 'ALL';

    const filtered = COOL_SCHOOLS_CAMPUSES.filter(c => distFilter === 'ALL' || c.district === distFilter);
    grid.innerHTML = filtered.map(c => {
      const isFlagship = c.status === 'Active Implementation';
      const tempDrop = (c.exposedTemp - c.shadedTemp).toFixed(1);
      return `
        <div class="campus-dir-card ${isFlagship ? 'active-campus' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--text-primary);">${c.name}</div>
              <div style="font-size:0.76rem; font-weight:700; color:var(--primary-light);">${c.district}</div>
            </div>
            <span class="tag-pill ${isFlagship ? 'tag-cool' : 'tag-kellogg'}">${c.status}</span>
          </div>
          <div class="program-metrics-row" style="padding:0.55rem;">
            <div class="prog-mini-stat">
              <span class="lbl">Canopy Goal</span>
              <span class="val" style="font-size:0.9rem;">${c.baselineCanopy}% → ${c.targetCanopy}%</span>
            </div>
            <div class="prog-mini-stat">
              <span class="lbl">Shade Cooling</span>
              <span class="val" style="font-size:0.9rem; color:#0d9488;">-${tempDrop}°F</span>
            </div>
            <div class="prog-mini-stat">
              <span class="lbl">Trees / Plan</span>
              <span class="val" style="font-size:0.9rem;">${c.trees} Trees</span>
            </div>
          </div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">
            🌡️ Surface: <strong>${c.exposedTemp}°F</strong> exposed vs <strong>${c.shadedTemp}°F</strong> shaded · 💧 Avoided Runoff: <strong>${c.runoffGal.toLocaleString()} gal</strong>
          </div>
          <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:auto; padding-top:6px; border-top:1px solid var(--border-light);">
            <button type="button" class="btn btn-primary btn-sm" style="padding:3px 8px; font-size:0.72rem;" onclick="window.launchCoolCampusModel('${c.id}', '../canopy.html')">🌲 30-Yr Canopy</button>
            <button type="button" class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:0.72rem;" onclick="window.launchCoolCampusModel('${c.id}', '../tree_3d.html')">☀️ 3D Shade</button>
            <button type="button" class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:0.72rem;" onclick="window.launchCoolCampusModel('${c.id}', '../viewshed.html')">🪟 Viewshed</button>
            <button type="button" class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:0.72rem;" onclick="window.launchCoolCampusModel('${c.id}', '../student_tracking.html')">👣 Heatmaps</button>
          </div>
        </div>
      `;
    }).join('');
  }

  const coolDistrictFilter = document.getElementById('coolDistrictFilter');
  if (coolDistrictFilter) {
    coolDistrictFilter.addEventListener('change', renderCoolSchoolsCampusesGrid);
  }

  // ========================================================
  // 12. Shared Sites, Fleet & Equipment Scheduler (View 6)
  // ========================================================
  function renderSharedAssetsGrid() {
    const grid = document.getElementById('sharedAssetsGrid');
    if (!grid) return;

    grid.innerHTML = sharedAssets.map((asset, idx) => {
      const statusCls = asset.status === 'Available' ? 'status-available' :
                        asset.status === 'Maintenance' ? 'status-maintenance' : 'status-reserved';
      return `
        <div class="asset-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="program-icon">${asset.icon}</div>
              <div>
                <h3 style="font-size:0.98rem; font-weight:800; color:var(--text-primary);">${asset.name}</h3>
                <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Custodian: ${asset.custodian}</span>
              </div>
            </div>
            <span class="asset-status-badge ${statusCls}">${asset.status}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-secondary);">${asset.specs}</p>
          <div style="background:var(--surface-subtle); padding:0.6rem 0.75rem; border-radius:6px; border:1px solid var(--border-light); font-size:0.78rem;">
            <strong>📌 Current / Next Reservation:</strong>
            <div style="color:var(--primary-mid); font-weight:600; margin-top:2px;">${asset.reservedBy}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; margin-top:auto; padding-top:6px; border-top:1px solid var(--border-light);">
            <select class="form-control asset-status-select" data-idx="${idx}" style="padding:0.32rem 0.5rem; font-size:0.76rem; flex:1;">
              <option value="Available" ${asset.status === 'Available' ? 'selected' : ''}>🟢 Available</option>
              <option value="Reserved / In Field" ${asset.status === 'Reserved / In Field' ? 'selected' : ''}>🟡 Reserved / In Field</option>
              <option value="Maintenance" ${asset.status === 'Maintenance' ? 'selected' : ''}>🔴 Maintenance</option>
            </select>
            <button type="button" class="btn btn-secondary btn-sm asset-reserve-btn" data-idx="${idx}">Update Log</button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.asset-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.getAttribute('data-idx'), 10);
        sharedAssets[idx].status = sel.value;
        setLocalJSON('master_command_assets', sharedAssets);
        renderSharedAssetsGrid();
        showToast(`Updated ${sharedAssets[idx].name} status to ${sel.value}`);
      });
    });

    grid.querySelectorAll('.asset-reserve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const current = sharedAssets[idx].reservedBy;
        const nextNote = prompt(`Enter reservation note & coworker for ${sharedAssets[idx].name}:`, current);
        if (nextNote !== null && nextNote.trim()) {
          sharedAssets[idx].reservedBy = cleanText(nextNote.trim());
          setLocalJSON('master_command_assets', sharedAssets);
          if (db) {
            db.collection('master_command_assets').doc('fleet').set({
              assets: sharedAssets,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(() => {});
          }
          renderSharedAssetsGrid();
          showToast(`Updated reservation for ${sharedAssets[idx].name}!`);
        }
      });
    });
  }

  // ========================================================
  // 13. Master Aggregation & Refresh Engine
  // ========================================================
  function refreshAllMetricsAndViews() {
    const unifiedRecords = getUnifiedActivityRecords();

    // 1. Kellogg Metrics
    const kelloggRecords = unifiedRecords.filter(r => Array.isArray(r.programs) && r.programs.includes('KELLOGG'));
    let kelloggAttendees = 0;
    kelloggRecords.forEach(r => {
      kelloggAttendees += (Array.isArray(r.attendees) ? r.attendees.length : 0);
    });
    const kChk = getKelloggChecklistStats();

    const elKReports = document.getElementById('pulseKelloggReports');
    const elKAtt = document.getElementById('pulseKelloggAttendees');
    const elKChkCount = document.getElementById('pulseKelloggCheckCount');
    const elKPct = document.getElementById('pulseKelloggPct');
    const elKBar = document.getElementById('pulseKelloggBar');

    if (elKReports) elKReports.textContent = `${kelloggRecords.length} Logs`;
    if (elKAtt) elKAtt.textContent = `${kelloggAttendees} Reached`;
    if (elKChkCount) elKChkCount.textContent = `${kChk.checked} / ${kChk.total}`;
    if (elKPct) elKPct.textContent = `${kChk.pct}%`;
    if (elKBar) elKBar.style.width = `${kChk.pct}%`;

    // 2. BFRDP Metrics
    const bChk = getBfrdpChecklistStats();
    const elBCohort = document.getElementById('pulseBfrdpCohort');
    const elBContacts = document.getElementById('pulseBfrdpContacts');
    const elBChkCount = document.getElementById('pulseBfrdpCheckCount');
    const elBPct = document.getElementById('pulseBfrdpPct');
    const elBBar = document.getElementById('pulseBfrdpBar');

    const contactCount = bfrdpContacts.length > 0 ? bfrdpContacts.length : 21;
    if (elBCohort) elBCohort.textContent = `${bfrdpCohort.length} Enrolled`;
    if (elBContacts) elBContacts.textContent = `${contactCount} Contacts`;
    if (elBChkCount) elBChkCount.textContent = `${bChk.checked} / ${bChk.total}`;
    if (elBPct) elBPct.textContent = `${bChk.pct}%`;
    if (elBBar) elBBar.style.width = `${bChk.pct}%`;

    // 3. Cool Schools Metrics
    const cChk = getCoolSchoolsChecklistStats();
    const totalTreesPlanted = COOL_SCHOOLS_CAMPUSES.reduce((acc, c) => acc + (c.trees || 0), 0);
    const elCTrees = document.getElementById('pulseCoolTreesCount');
    const elCPct = document.getElementById('pulseCoolPct');
    const elCBar = document.getElementById('pulseCoolBar');
    const elCMasterPct = document.getElementById('coolSchoolsMasterPct');
    const elCMasterBar = document.getElementById('coolSchoolsMasterBar');

    if (elCTrees) elCTrees.textContent = `${totalTreesPlanted} Trees`;
    if (elCPct) elCPct.textContent = `${cChk.pct}%`;
    if (elCBar) elCBar.style.width = `${cChk.pct}%`;
    if (elCMasterPct) elCMasterPct.textContent = `${cChk.pct}% (${cChk.checked} of ${cChk.total} Pillars Completed)`;
    if (elCMasterBar) elCMasterBar.style.width = `${cChk.pct}%`;

    // 4. Hub Task Completion
    const doneTasks = masterTasks.filter(t => t.done).length;
    const hubPct = masterTasks.length > 0 ? Math.round((doneTasks / masterTasks.length) * 100) : 65;
    const elHPct = document.getElementById('pulseHubPct');
    const elHBar = document.getElementById('pulseHubBar');
    if (elHPct) elHPct.textContent = `${hubPct}%`;
    if (elHBar) elHBar.style.width = `${hubPct}%`;

    // 5. Top Hero KPI Stat Bar
    const totalEventsAndLogs = unifiedRecords.length + masterCalendarEvents.length;
    let totalPeopleLogged = bfrdpCohort.length + contactCount;
    unifiedRecords.forEach(r => {
      totalPeopleLogged += (Array.isArray(r.attendees) ? r.attendees.length : 0);
    });
    const avgDeliverablesPct = Math.round((kChk.pct + bChk.pct + cChk.pct) / 3);

    const heroEv = document.getElementById('heroTotalEventsCount');
    const heroEvSub = document.getElementById('heroTotalEventsSub');
    const heroPpl = document.getElementById('heroTotalPeopleCount');
    const heroPct = document.getElementById('heroOverallProgressPct');

    if (heroEv) heroEv.textContent = totalEventsAndLogs;
    if (heroEvSub) heroEvSub.textContent = `${unifiedRecords.length} Activity Logs + ${masterCalendarEvents.length} Scheduled Events`;
    if (heroPpl) heroPpl.textContent = `${totalPeopleLogged}+`;
    if (heroPct) heroPct.textContent = `${avgDeliverablesPct}%`;

    renderUnifiedPulseFeed();
    renderMasterWorkbookGrid();
    renderLoggerCohortCheckboxes();
  }

  // ========================================================
  // 14. Live Firestore Listeners (`kellogg-dashboard`)
  // ========================================================
  function initMasterFirestoreListeners() {
    if (!db) return;

    // 1. Listen to Kellogg `wkkf_reports`
    db.collection('wkkf_reports').onSnapshot(snap => {
      const records = [];
      snap.forEach(doc => records.push({ id: doc.id, ...doc.data() }));
      if (records.length > 0) {
        wkkfReports = records;
        setLocalJSON('wkkf_reports', wkkfReports);
        refreshAllMetricsAndViews();
      }
    }, () => {});

    // 2. Listen to Kellogg `wkkf_meta/checklist`
    db.collection('wkkf_meta').doc('checklist').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data() || {};
        Object.keys(data).forEach(k => {
          if (k.startsWith('chk-')) {
            localStorage.setItem(`wkkf_chk_${k}`, data[k]);
          }
        });
        refreshAllMetricsAndViews();
      }
    }, () => {});

    // 3. Listen to BFRDP `bfrdp_data/checklist`, `cohort`, `contacts`
    db.collection('bfrdp_data').doc('checklist').onSnapshot(doc => {
      if (doc.exists && doc.data()?.state) {
        setLocalJSON('bfrdp_checklist_state', doc.data().state);
        refreshAllMetricsAndViews();
      }
    }, () => {});

    db.collection('bfrdp_data').doc('cohort').onSnapshot(doc => {
      if (doc.exists && Array.isArray(doc.data()?.roster)) {
        bfrdpCohort = doc.data().roster;
        setLocalJSON('bfrdp_cohort_roster', bfrdpCohort);
        refreshAllMetricsAndViews();
      }
    }, () => {});

    db.collection('bfrdp_data').doc('contacts').onSnapshot(doc => {
      if (doc.exists && Array.isArray(doc.data()?.list)) {
        bfrdpContacts = doc.data().list.map(c => ({ ...c, org: cleanText(c.org) }));
        setLocalJSON('bfrdp_contacts_list', bfrdpContacts);
        refreshAllMetricsAndViews();
      }
    }, () => {});

    // 4. Listen to `master_command_logs`
    db.collection('master_command_logs').onSnapshot(snap => {
      const liveLogs = [];
      snap.forEach(doc => liveLogs.push({ id: doc.id, ...doc.data() }));
      if (liveLogs.length > 0) {
        // Merge with historical seed logs so nothing disappears
        const byKey = new Map();
        [...HISTORICAL_SEED_LOGS, ...liveLogs].forEach(item => {
          const k = `${item.date}_${(item.topic || '').toLowerCase().trim()}`;
          byKey.set(k, item);
        });
        masterLogs = Array.from(byKey.values());
        setLocalJSON('master_command_logs', masterLogs);
        refreshAllMetricsAndViews();
      }
    }, () => {});

    // 5. Listen to `cool_schools_data/checklist`
    db.collection('cool_schools_data').doc('checklist').onSnapshot(doc => {
      if (doc.exists && doc.data()?.state) {
        const st = doc.data().state;
        setLocalJSON('cool_schools_checklist_state', st);
        coolCheckboxes.forEach(chk => {
          if (typeof st[chk.id] === 'boolean') chk.checked = st[chk.id];
        });
        refreshAllMetricsAndViews();
      }
    }, () => {});
  }

  if (isFirebaseAvailable) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      if (firebase.auth) {
        firebase.auth().signInAnonymously().then(() => {
          updateSyncStatus(true, 'Live Firestore Sync Active');
          initMasterFirestoreListeners();
        }).catch(() => {
          updateSyncStatus(true, 'Live Firestore Sync Active');
          initMasterFirestoreListeners();
        });
      } else {
        updateSyncStatus(true, 'Live Firestore Sync Active');
        initMasterFirestoreListeners();
      }
    } catch (e) {
      updateSyncStatus(false, 'Local Storage Active');
    }
  } else {
    updateSyncStatus(false, 'Local Storage Active');
  }

  // ========================================================
  // 15. Initial Render of All 6 Command Center Views
  // ========================================================
  renderCoworkersDirectory();
  renderTeamTaskBoard();
  renderMasterCalendar();
  renderCoolSchoolsCampusesGrid();
  renderSharedAssetsGrid();
  refreshAllMetricsAndViews();

});

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================
  // Toast Notification System
  // ========================================================
  function showToast(message, type = 'success') {
    let container = document.getElementById('bfrToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bfrToastContainer';
      container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#1b4332' : type === 'warning' ? '#d4a373' : '#b91c1c';
    toast.style.cssText = `background: ${bg}; color: white; padding: 12px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; box-shadow: 0 4px 14px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; opacity: 0; transform: translateY(10px); pointer-events: auto;`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : '✕';
    toast.innerHTML = `<span style="font-weight: 700; font-size: 1.1rem; color: #e9c46a;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }
  window.showToast = showToast;

  // ========================================================
  // Firebase Configuration & Initialization
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
      badge.style.background = 'rgba(82, 183, 136, 0.2)';
      badge.style.color = '#d8f3dc';
      if (dot) dot.style.backgroundColor = '#52b788';
      if (textEl) textEl.textContent = message || 'Live Cloud Sync Active';
    } else {
      badge.style.background = 'rgba(233, 196, 106, 0.15)';
      badge.style.color = '#fef3c7';
      if (dot) dot.style.backgroundColor = '#e9c46a';
      if (textEl) textEl.textContent = message || 'Local Storage (Active)';
    }
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
          initFirestoreListeners();
        }).catch((authErr) => {
          console.warn("Firebase anonymous auth fallback:", authErr);
          updateSyncStatus(true, 'Live Firestore Sync Active');
          initFirestoreListeners();
        });
      } else {
        updateSyncStatus(true, 'Live Firestore Sync Active');
        initFirestoreListeners();
      }
    } catch (err) {
      console.warn("Firebase initialization error, using local storage:", err);
      updateSyncStatus(false, 'Local Storage (Active)');
    }
  } else {
    updateSyncStatus(false, 'Local Storage (Active)');
  }

  // ========================================================
  // Navigation & Tab Switching
  // ========================================================
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');

  function switchView(targetViewId) {
    viewSections.forEach(section => {
      section.classList.remove('active');
      if (section.id === targetViewId) {
        section.classList.add('active');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-target') === targetViewId) {
        link.classList.add('active');
      }
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute('data-target');
      switchView(targetViewId);
      window.location.hash = link.getAttribute('href').replace('#', '');
    });
  });

  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    const matchedLink = document.querySelector(`.nav-link[href="#${hash}"]`);
    if (matchedLink) {
      const targetId = matchedLink.getAttribute('data-target');
      switchView(targetId);
    }
  }

  // ========================================================
  // Deliverables Checklist State & Progress Tracker
  // ========================================================
  const checkboxes = document.querySelectorAll('.grant-checkbox');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressBarLabel = document.getElementById('progressBarLabel');
  const statOverallProgress = document.getElementById('statOverallProgress');
  const statDeliverablesCompleted = document.getElementById('statDeliverablesCompleted');

  function updateChecklistProgress() {
    let checkedCount = 0;
    const total = checkboxes.length;

    checkboxes.forEach(chk => {
      if (chk.checked) checkedCount++;
    });

    const percent = Math.round((checkedCount / total) * 100);
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (progressBarLabel) progressBarLabel.textContent = `${percent}%`;
    if (statOverallProgress) statOverallProgress.textContent = `${percent}%`;
    if (statDeliverablesCompleted) statDeliverablesCompleted.textContent = `${checkedCount} of ${total} Completed`;
  }

  function loadChecklistState() {
    const saved = localStorage.getItem('bfrdp_checklist_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        checkboxes.forEach(chk => {
          if (state[chk.id] !== undefined) {
            chk.checked = state[chk.id];
          }
        });
      } catch (e) {
        console.error('Error loading checklist state', e);
      }
    }
    updateChecklistProgress();
  }

  function saveChecklistState(showNotification = true) {
    const state = {};
    checkboxes.forEach(chk => {
      state[chk.id] = chk.checked;
    });
    localStorage.setItem('bfrdp_checklist_state', JSON.stringify(state));

    if (db) {
      db.collection('bfrdp_data').doc('checklist').set({
        state: state,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(err => console.warn('Firestore checklist sync error:', err));
    }

    if (showNotification) {
      showToast('Deliverables progress saved & synced!');
    }
  }

  checkboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      updateChecklistProgress();
      saveChecklistState(false);
    });
  });

  const btnSaveChecklist = document.getElementById('btnSaveChecklist');
  if (btnSaveChecklist) {
    btnSaveChecklist.addEventListener('click', () => saveChecklistState(true));
  }

  const btnResetChecklist = document.getElementById('btnResetChecklist');
  if (btnResetChecklist) {
    btnResetChecklist.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all checklist marks?')) {
        checkboxes.forEach(chk => chk.checked = false);
        localStorage.removeItem('bfrdp_checklist_state');
        if (db) {
          db.collection('bfrdp_data').doc('checklist').delete().catch(err => console.warn(err));
        }
        updateChecklistProgress();
        showToast('Checklist marks have been reset.', 'warning');
      }
    });
  }

  // ========================================================
  // Stakeholder Directory & Contacts CRM
  // ========================================================
  const defaultContacts = [
    // Core Leadership
    { name: "Dr. Alexis Racelis", title: "Lead PI & Project Director", org: "UTRGV / SARA", county: "Hidalgo / Edinburg", category: "leadership", status: "active", info: "alexis.racelis@utrgv.edu", role: "Overall Project Director" },
    { name: "Dr. Lockman", title: "Narrative & Strategy Lead", org: "UTRGV", county: "Regional", category: "leadership", status: "active", info: "lockman@utrgv.edu", role: "Grant Narrative & Evaluation" },
    { name: "Aisha", title: "Grants & Compliance Officer", org: "UTRGV Grants Admin", county: "Regional", category: "leadership", status: "active", info: "aisha.grants@utrgv.edu", role: "Federal Compliance & Checklists" },
    { name: "Alex & Valdez", title: "GIS & Spatial Analysts", org: "UTRGV Agroecology", county: "8 Counties", category: "leadership", status: "active", info: "gis.agroecology@utrgv.edu", role: "8-County Producer Mapping" },
    { name: "Annalise", title: "Budget & Financial Liaison", org: "UTRGV Project Admin", county: "Regional", category: "leadership", status: "active", info: "annalise.admin@utrgv.edu", role: "Budget Capacity & Subcontracts" },
    { name: "Juan & Demetrio", title: "Field Operations Leads", org: "Hub of Prosperity", county: "Hidalgo / Edinburg", category: "leadership", status: "active", info: "hub.field@utrgv.edu", role: "Incubator Groundbreaking & Plots" },
    { name: "Desiderio / Desi", title: "Field Trials & Telemetry Lead", org: "UTRGV Agroecology", county: "Hidalgo / Cameron", category: "leadership", status: "active", info: "desi.trials@utrgv.edu", role: "Cover Crops & Sensor Telemetry" },

    // Contractors & Staff
    { name: "Marcelino Garza", title: "Farmer Liaison & Outreach Lead", org: "Good Grow (Formerly PPC Farms)", county: "Hidalgo / Mission", category: "contractor", status: "drafted", info: "marcelino@goodgrow.org", role: "Farmer Outreach & Mentoring" },
    { name: "Patty", title: "Community Outreach Coordinator", org: "Regional Outreach Partner", county: "Cameron / Hidalgo", category: "contractor", status: "drafted", info: "patty.outreach@rgvag.org", role: "Bilingual Recruitment & Events" },
    { name: "Kitchen Table Consultants", title: "Agribusiness Financial Mentors", org: "External Ag Financial Advisors", county: "Regional / Virtual", category: "contractor", status: "pending", info: "info@kitchentableconsultants.com", role: "1-on-1 Financial Benchmarking" },

    // Farmer Mentors & Producers
    { name: "Lindsey Richards", title: "Texas Regional Outreach", org: "American Farmland Trust (AFT)", county: "Statewide / RGV", category: "partner", status: "partner", info: "lrichards@farmland.org", role: "Land Access & Succession" },
    { name: "Servando Leal", title: "Chair", org: "South Texas Grazing Land Coalition", county: "Hidalgo / Weslaco", category: "farmer", status: "partner", info: "leal.grazing@stglc.org", role: "Silvopasture & Rotational Grazing" },
    { name: "Maria Gonzalez", title: "Farm Manager", org: "Hub of Prosperity Living Lab", county: "Hidalgo / Edinburg", category: "farmer", status: "partner", info: "maria.gonzalez@utrgv.edu", role: "Incubator Living Lab Manager" },
    { name: "Matt & Vanessa Ramon", title: "Lead Farmers", org: "Sunshine Bounty Farmers", county: "Cameron / San Benito", category: "farmer", status: "farmer", info: "ramon@sunshinebounty.com", role: "Specialty Crop & Direct Marketing" },
    { name: "Travis Johnson", title: "Managing Partner", org: "Johnson Partnership", county: "Cameron / Santa Rosa", category: "farmer", status: "partner", info: "tjohnson@johnsonag.com", role: "Strip Tillage & Cover Crops" },
    { name: "Jordan Rooney", title: "Director of Ag Operations", org: "IDEA Public School Farms", county: "Hidalgo / Weslaco", category: "partner", status: "partner", info: "jrooney@ideafarms.org", role: "Youth-to-Farmer Pipeline" },
    { name: "Courtney Schuster", title: "Post-Harvest Operations", org: "Rio Fresh", county: "Hidalgo / Alamo", category: "partner", status: "partner", info: "cschuster@riofresh.com", role: "Commercial Packing & Cold Storage" },
    { name: "Andy Cruz", title: "Farm Manager", org: "Hilltop Gardens", county: "Willacy / Lyford", category: "farmer", status: "farmer", info: "acruz@hilltopgardens.org", role: "Subtropical Botanicals & Organics" },
    { name: "George Bennack", title: "Owner / Operator", org: "Crossroads Farm", county: "Willacy / Lyford", category: "farmer", status: "farmer", info: "gbennack@crossroadsfarm.org", role: "Beginner Farm Mentor Host" },
    { name: "Mani Skaria", title: "Founder & Citrus Scientist", org: "US Citrus", county: "Hidalgo / Hargill", category: "farmer", status: "farmer", info: "ms@uscitrus.com", role: "Micro-Budding & Citrus Resilience" },
    { name: "Katie Lavallee", title: "Owner & Grower", org: "Weaving Webs Farm", county: "Cameron / Harlingen", category: "farmer", status: "farmer", info: "katie@weavingwebsfarm.com", role: "Ecological Weed Control & CSA" },
    { name: "Stephen Obst", title: "Managing Partner", org: "Obst Family Farms", county: "Willacy / Raymondville", category: "farmer", status: "farmer", info: "sobst@obstfarms.com", role: "Dryland Cover Crops & Grazing" },
    { name: "TIPA (Texas Int. Produce Assoc.)", title: "Industry Association", org: "Texas International Produce Association", county: "Regional / Mission", category: "partner", status: "partner", info: "info@texaspac.org", role: "Wholesale & Binational Trade" },
    { name: "Jaime de Anda & Nelly's Husband", title: "Cross-Border Agricultural Liaisons", org: "Tamaulipas Ag & TDA Network", county: "Cross-Border / Binational", category: "partner", status: "partner", info: "binational@rgvagroecology.com", role: "Binational Grower Exchange" }
  ];

  let contacts = [];

  function loadContacts() {
    const saved = localStorage.getItem('bfrdp_contacts_list');
    if (saved) {
      try {
        contacts = JSON.parse(saved);
      } catch (e) {
        contacts = [...defaultContacts];
      }
    } else {
      contacts = [...defaultContacts];
    }
    renderContactsTable();
  }

  function saveContacts() {
    localStorage.setItem('bfrdp_contacts_list', JSON.stringify(contacts));
    if (db) {
      db.collection('bfrdp_data').doc('contacts').set({
        list: contacts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(err => console.warn('Firestore contacts sync error:', err));
    }
  }

  function renderContactsTable(filter = 'all', searchQuery = '') {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const query = searchQuery.toLowerCase().trim();

    const filtered = contacts.filter(item => {
      const matchCategory = (filter === 'all' || item.category === filter);
      const matchSearch = query === '' || 
        item.name.toLowerCase().includes(query) ||
        item.org.toLowerCase().includes(query) ||
        item.county.toLowerCase().includes(query) ||
        item.role.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching contacts found.</td></tr>`;
      return;
    }

    filtered.forEach((contact) => {
      const tr = document.createElement('tr');
      const statusClass = contact.status === 'active' ? 'active' :
                          contact.status === 'partner' ? 'partner' :
                          contact.status === 'drafted' ? 'drafted' : 'pending';
      const statusLabel = contact.status === 'active' ? 'Active Lead' :
                          contact.status === 'partner' ? 'Letter Partner' :
                          contact.status === 'drafted' ? 'MOU Drafted' : 'Pending Outreach';

      tr.innerHTML = `
        <td>
          <span class="contact-name">${contact.name}</span>
          <span class="contact-org">${contact.title || ''}</span>
        </td>
        <td><strong>${contact.org}</strong></td>
        <td>${contact.county}</td>
        <td><span style="font-weight: 500; color: var(--primary-light);">${contact.role}</span></td>
        <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
        <td>
          <a href="mailto:${contact.info}" class="btn btn-secondary btn-sm" title="${contact.info}">Contact ✉️</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Filter chips
  const filterChips = document.querySelectorAll('.filter-chip');
  let currentFilter = 'all';

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      const searchInput = document.getElementById('contactSearchInput');
      renderContactsTable(currentFilter, searchInput ? searchInput.value : '');
    });
  });

  const searchInput = document.getElementById('contactSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderContactsTable(currentFilter, e.target.value);
    });
  }

  // Add Contact Modal Handlers
  const addContactModal = document.getElementById('addContactModal');
  const btnOpenAddContactModal = document.getElementById('btnOpenAddContactModal');
  const btnCloseContactModal = document.getElementById('btnCloseContactModal');
  const btnCancelContactModal = document.getElementById('btnCancelContactModal');
  const addContactForm = document.getElementById('addContactForm');

  if (btnOpenAddContactModal && addContactModal) {
    btnOpenAddContactModal.addEventListener('click', () => addContactModal.classList.add('active'));
  }
  if (btnCloseContactModal && addContactModal) {
    btnCloseContactModal.addEventListener('click', () => addContactModal.classList.remove('active'));
  }
  if (btnCancelContactModal && addContactModal) {
    btnCancelContactModal.addEventListener('click', () => addContactModal.classList.remove('active'));
  }

  if (addContactForm) {
    addContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newContact = {
        name: document.getElementById('modalContactName').value.trim(),
        title: "Key Representative",
        org: document.getElementById('modalContactOrg').value.trim(),
        county: document.getElementById('modalContactCounty').value.trim(),
        category: document.getElementById('modalContactCategory').value,
        status: document.getElementById('modalContactStatus').value,
        info: document.getElementById('modalContactInfo').value.trim() || 'contact@example.com',
        role: "Regional Stakeholder & Collaborator"
      };

      contacts.unshift(newContact);
      saveContacts();
      renderContactsTable(currentFilter, searchInput ? searchInput.value : '');
      addContactModal.classList.remove('active');
      addContactForm.reset();
      showToast(`Added contact ${newContact.name} to directory!`);
    });
  }

  // ========================================================
  // Farmer Cohort & Incubator Roster
  // ========================================================
  const defaultCohort = [
    { name: "Carlos Alvarez", tier: "Tier 1 (0–1 yr)", enterprise: "Specialty Melons & Roselle", plot: "Hub Plot 1A (1/4 Acre)", hours: "18 hrs", mentor: "Marcelino Garza / Good Grow" },
    { name: "Guadalupe Peña", tier: "Tier 1 (0–1 yr)", enterprise: "Subtropical Winter Brassicas", plot: "Hub Plot 2B (1/4 Acre)", hours: "22 hrs", mentor: "Maria Gonzalez / Hub Farm" },
    { name: "Mateo De Leon", tier: "Tier 1 (0–1 yr)", enterprise: "Pastured Poultry & Cover Crops", plot: "Hub Zone C-Pasture", hours: "14 hrs", mentor: "Servando Leal / STGLC" },
    { name: "Elena Villarreal", tier: "Tier 2 (1–3 yrs)", enterprise: "Direct CSA & Herb Cultivation", plot: "Off-site (Alamo, TX)", hours: "28 hrs (Completed)", mentor: "Katie Lavallee / Weaving Webs" },
    { name: "Ramiro Hinojosa", tier: "Tier 2 (1–3 yrs)", enterprise: "Dryland Grain Sorghum / Strip Till", plot: "Off-site (Raymondville)", hours: "26 hrs (Completed)", mentor: "Stephen Obst / Obst Farms" },
    { name: "Lucia Morales", tier: "Tier 2 (1–3 yrs)", enterprise: "High-Tunnel Heirloom Tomatoes", plot: "Hub Incubator Tunnel 1", hours: "30 hrs (Completed)", mentor: "George Bennack / Crossroads" }
  ];

  let cohort = [];

  function loadCohort() {
    const saved = localStorage.getItem('bfrdp_cohort_roster');
    if (saved) {
      try {
        cohort = JSON.parse(saved);
      } catch (e) {
        cohort = [...defaultCohort];
      }
    } else {
      cohort = [...defaultCohort];
    }
    renderCohortTable();
  }

  function saveCohort() {
    localStorage.setItem('bfrdp_cohort_roster', JSON.stringify(cohort));
    if (db) {
      db.collection('bfrdp_data').doc('cohort').set({
        roster: cohort,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(err => console.warn('Firestore cohort sync error:', err));
    }
  }

  function renderCohortTable() {
    const tbody = document.getElementById('cohortTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    cohort.forEach(farmer => {
      const tr = document.createElement('tr');
      const isTier1 = farmer.tier.includes('Tier 1');
      const tierTag = isTier1 ? 'tag-tier1' : 'tag-tier2';

      tr.innerHTML = `
        <td><strong style="color: var(--primary-color);">${farmer.name}</strong></td>
        <td><span class="checklist-tag ${tierTag}">${farmer.tier}</span></td>
        <td>${farmer.enterprise}</td>
        <td><span style="font-weight: 500;">${farmer.plot}</span></td>
        <td><span class="badge-status active">${farmer.hours}</span></td>
        <td>${farmer.mentor || 'Assigned in Session'}</td>
      `;
      tbody.appendChild(tr);
    });

    const t1Count = cohort.filter(c => c.tier.includes('Tier 1')).length;
    const t2Count = cohort.filter(c => c.tier.includes('Tier 2')).length;
    const gradCount = cohort.filter(c => c.hours.includes('Completed') || parseInt(c.hours) >= 25).length;

    const elT1 = document.getElementById('tier1ActiveCount');
    const elT2 = document.getElementById('tier2ActiveCount');
    const elGrad = document.getElementById('graduatedCount');
    const elHeroGrad = document.getElementById('statGradCount');

    if (elT1) elT1.textContent = `${t1Count} / 15 Enrolled`;
    if (elT2) elT2.textContent = `${t2Count} / 30 Enrolled`;
    if (elGrad) elGrad.textContent = `${gradCount} / 60 Goal`;
    if (elHeroGrad) elHeroGrad.textContent = `${cohort.length} Enrolled`;
  }

  // Add Cohort Modal Handlers
  const addCohortModal = document.getElementById('addCohortModal');
  const btnOpenAddCohortModal = document.getElementById('btnOpenAddCohortModal');
  const btnCloseCohortModal = document.getElementById('btnCloseCohortModal');
  const btnCancelCohortModal = document.getElementById('btnCancelCohortModal');
  const addCohortForm = document.getElementById('addCohortForm');

  if (btnOpenAddCohortModal && addCohortModal) {
    btnOpenAddCohortModal.addEventListener('click', () => addCohortModal.classList.add('active'));
  }
  if (btnCloseCohortModal && addCohortModal) {
    btnCloseCohortModal.addEventListener('click', () => addCohortModal.classList.remove('active'));
  }
  if (btnCancelCohortModal && addCohortModal) {
    btnCancelCohortModal.addEventListener('click', () => addCohortModal.classList.remove('active'));
  }

  if (addCohortForm) {
    addCohortForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newFarmer = {
        name: document.getElementById('modalCohortName').value.trim(),
        tier: document.getElementById('modalCohortTier').value,
        enterprise: document.getElementById('modalCohortEnterprise').value.trim(),
        plot: document.getElementById('modalCohortPlot').value.trim(),
        hours: "0 hrs (Enrolled)",
        mentor: document.getElementById('modalCohortMentor').value.trim() || 'Assigned in Session'
      };

      cohort.unshift(newFarmer);
      saveCohort();
      renderCohortTable();
      addCohortModal.classList.remove('active');
      addCohortForm.reset();
      showToast(`Onboarded producer ${newFarmer.name}!`);
    });
  }

  // ========================================================
  // Farmer Intake Survey Form
  // ========================================================
  const farmerIntakeForm = document.getElementById('farmerIntakeForm');
  if (farmerIntakeForm) {
    farmerIntakeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('intakeName').value.trim();
      const farm = document.getElementById('intakeFarm').value.trim();
      const county = document.getElementById('intakeCounty').value;
      const tier = document.getElementById('intakeTier').value;
      const enterprise = document.getElementById('intakeEnterprise').value.trim() || 'Diversified Crops';
      const phone = document.getElementById('intakePhone').value.trim();
      const email = document.getElementById('intakeEmail').value.trim();
      const language = document.getElementById('intakeLanguage').value;
      const goals = document.getElementById('intakeGoals').value.trim();

      const newFarmer = {
        name: name + (farm ? ` (${farm})` : ''),
        tier: tier.split(' - ')[0],
        enterprise: enterprise,
        plot: tier.includes('Tier 1') ? 'Hub Incubator (Pending Plot)' : `Off-Site (${county} County)`,
        hours: '0 hrs (Intake Received)',
        mentor: 'Outreach Team / Marcelino'
      };

      cohort.unshift(newFarmer);
      saveCohort();
      renderCohortTable();

      const newContact = {
        name: name,
        title: "Beginning Farmer Applicant",
        org: farm || `${name}'s Farm`,
        county: `${county} County`,
        category: "farmer",
        status: "active",
        info: phone || email || 'Applicant',
        role: `${tier} Applicant`
      };
      contacts.unshift(newContact);
      saveContacts();
      renderContactsTable(currentFilter, searchInput ? searchInput.value : '');

      // Store in Firestore survey submissions collection if online
      if (db) {
        db.collection('bfrdp_intakes').add({
          name, farm, county, tier, enterprise, phone, email, language, goals,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.warn('Firestore intake store error:', err));
      }

      farmerIntakeForm.reset();
      showToast(`¡Bienvenido! Intake survey submitted for ${name}.`);
      switchView('cohort-view');
    });
  }

  // ========================================================
  // REEport Narrative Copy Handler
  // ========================================================
  const btnCopyReportDraft = document.getElementById('btnCopyReportDraft');
  if (btnCopyReportDraft) {
    btnCopyReportDraft.addEventListener('click', () => {
      const draft = document.getElementById('reeportNarrativeDraft');
      if (draft) {
        navigator.clipboard.writeText(draft.value).then(() => {
          showToast('REEport narrative draft copied to clipboard!');
        }).catch(() => {
          draft.select();
          document.execCommand('copy');
          showToast('Copied draft to clipboard!');
        });
      }
    });
  }

  // ========================================================
  // Firestore Live Listeners
  // ========================================================
  function initFirestoreListeners() {
    if (!db) return;

    // Listen to Checklist State
    db.collection('bfrdp_data').doc('checklist').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data && data.state) {
          localStorage.setItem('bfrdp_checklist_state', JSON.stringify(data.state));
          checkboxes.forEach(chk => {
            if (data.state[chk.id] !== undefined) {
              chk.checked = data.state[chk.id];
            }
          });
          updateChecklistProgress();
        }
      }
    }, err => {
      console.warn('Checklist listener error:', err);
    });

    // Listen to Contacts List
    db.collection('bfrdp_data').doc('contacts').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          contacts = data.list;
          localStorage.setItem('bfrdp_contacts_list', JSON.stringify(contacts));
          renderContactsTable(currentFilter, searchInput ? searchInput.value : '');
        }
      }
    }, err => {
      console.warn('Contacts listener error:', err);
    });

    // Listen to Cohort Roster
    db.collection('bfrdp_data').doc('cohort').onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.roster) && data.roster.length > 0) {
          cohort = data.roster;
          localStorage.setItem('bfrdp_cohort_roster', JSON.stringify(cohort));
          renderCohortTable();
        }
      }
    }, err => {
      console.warn('Cohort listener error:', err);
    });
  }

  // ========================================================
  // Initialize Local State First
  // ========================================================
  loadChecklistState();
  loadContacts();
  loadCohort();

});

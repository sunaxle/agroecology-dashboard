document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // Firebase Configuration & Initialization
  // ==========================================
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

  function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#2D6A4F' : type === 'warning' ? '#D4A373' : '#B91C1C';
    toast.style.cssText = `background: ${bg}; color: white; padding: 12px 18px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; opacity: 0; transform: translateY(10px); pointer-events: auto;`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : '✕';
    toast.innerHTML = `<span style="font-weight: 700; font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, 4500);
  }
  window.showToast = showToast;

  function updateSyncStatus(connected, message) {
    const badge = document.getElementById('dbSyncStatus');
    if (!badge) return;
    const textEl = badge.querySelector('.status-text');
    if (connected) {
      badge.className = 'db-sync-status connected';
      if (textEl) textEl.textContent = message || 'Live Cloud Sync Active';
    } else {
      badge.className = 'db-sync-status error';
      if (textEl) textEl.textContent = message || 'Local Storage (Offline)';
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
          updateSyncStatus(true, 'Live Cloud Sync Active');
        }).catch((authErr) => {
          console.warn("Firebase anonymous auth error:", authErr);
          updateSyncStatus(true, 'Live Cloud Sync Active');
        });
      } else {
        updateSyncStatus(true, 'Live Cloud Sync Active');
      }
    } catch (err) {
      console.warn("Firebase initialization error:", err);
      updateSyncStatus(false, 'Local Storage (Offline)');
    }
  } else {
    updateSyncStatus(false, 'Local Storage (Offline)');
  }

  // ==========================================
  // Helper: Season & Month Identification
  // ==========================================
  function getSeasonFromDate(dateStr) {
    if (!dateStr) return 'fall-2026';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'fall-2026';
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    if (year === 2026 && month >= 6 && month <= 8) return 'summer-2026';
    if (year === 2026 && month >= 9 && month <= 11) return 'fall-2026';
    if ((year === 2026 && month === 12) || (year === 2027 && (month === 1 || month === 2))) return 'winter-2026';
    if (year === 2027 && month >= 3 && month <= 5) return 'spring-2027';
    if (year === 2027 && month >= 6 && month <= 8) return 'summer-2027';
    if (year >= 2027 && month >= 9) return 'post-grant';
    return 'fall-2026';
  }

  function formatMonthName(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // ==========================================
  // Tab Navigation Logic
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      navLinks.forEach(l => l.classList.remove('active'));
      viewSections.forEach(s => s.classList.remove('active'));
      
      link.classList.add('active');
      const targetId = link.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }

      if (targetId === 'compiled-view') {
        updateCompiledReport();
      }
    });
  });

  // ==========================================
  // Deliverables Checklist (Live & Cached)
  // ==========================================
  const checkboxes = document.querySelectorAll('.checkbox');

  checkboxes.forEach(checkbox => {
    const savedState = localStorage.getItem(`wkkf_chk_${checkbox.id}`);
    if (savedState === 'true') {
      checkbox.checked = true;
    }

    checkbox.addEventListener('change', async (e) => {
      const isChecked = e.target.checked;
      localStorage.setItem(`wkkf_chk_${checkbox.id}`, isChecked);

      if (db) {
        try {
          await db.collection('wkkf_meta').doc('checklist').set({
            [checkbox.id]: isChecked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn("Error saving checkbox to Firestore:", err);
        }
      }
      updateCompiledReport();
    });
  });

  if (db) {
    db.collection('wkkf_meta').doc('checklist').onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        checkboxes.forEach(checkbox => {
          if (typeof data[checkbox.id] === 'boolean') {
            checkbox.checked = data[checkbox.id];
            localStorage.setItem(`wkkf_chk_${checkbox.id}`, data[checkbox.id]);
          }
        });
        updateCompiledReport();
      }
    }, (err) => {
      console.warn("Checklist sync warning:", err);
    });
  }

  // ==========================================
  // Data Stores (In-Memory & Cache)
  // ==========================================
  const SURVEY_KEYS = {
    market: 'wkkf_surveys_market',
    mall: 'wkkf_surveys_mall',
    csa: 'wkkf_surveys_csa',
    farmer: 'wkkf_surveys_farmer'
  };

  const getCachedData = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
      return [];
    }
  };

  const setCachedData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`LocalStorage quota exceeded writing ${key}, stripping embedded image payloads:`, err);
      try {
        const lightweightData = data.map(item => {
          if (item && item.photos && Array.isArray(item.photos)) {
            return {
              ...item,
              photos: item.photos.filter(p => !p.startsWith('data:image'))
            };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweightData));
      } catch (err2) {
        console.error(`Unable to save ${key} to localStorage:`, err2);
      }
    }
  };

  // Client-side image compression to prevent memory/storage overflow
  function compressImage(file, maxWidth = 960, maxHeight = 960, quality = 0.65) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], (file.name || 'photo').replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
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

  let reports = getCachedData('wkkf_reports');
  let currentSeasonFilter = 'all';

  // ==========================================
  // Lightbox & Photo Gallery Viewer
  // ==========================================
  function openLightbox(src, caption) {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImage');
    const cap = document.getElementById('lightboxCaption');
    if (modal && img) {
      img.src = src;
      if (cap) cap.textContent = caption || '';
      modal.classList.add('active');
    }
  }
  window.openLightbox = openLightbox;

  // Helper to render photo thumbnails in table rows
  function renderPhotoCell(record) {
    const photos = record.photos && Array.isArray(record.photos) && record.photos.length > 0 ? record.photos : [];
    const link = record.photoLink || '';

    if (photos.length > 0) {
      let html = `<div class="table-photo-gallery">`;
      photos.forEach(url => {
        html += `<img src="${url}" class="table-thumbnail" onclick="openLightbox('${url}', '${(record.topic || '').replace(/'/g, "\\'")}')" alt="Event photo" title="Click to enlarge">`;
      });
      if (link && link.includes('drive.google.com')) {
        html += `<a href="${link}" target="_blank" style="margin-left: 0.35rem; font-size: 0.75rem; color: var(--primary-color);">📁 Drive</a>`;
      }
      html += `</div>`;
      return html;
    } else if (link) {
      if (link.match(/\.(jpeg|jpg|png|webp|gif)$/i) || link.startsWith('data:image') || link.includes('W.K. Kellogg Foundation Photos')) {
        return `<div class="table-photo-gallery"><img src="${link}" class="table-thumbnail" onclick="openLightbox('${link}', '${(record.topic || '').replace(/'/g, "\\'")}')" alt="Event photo" title="Click to enlarge"></div>`;
      }
      return `<a href="${link}" target="_blank" style="color: var(--primary-color); font-weight: 600; font-size: 0.85rem;">View Album</a>`;
    }
    return `<span style="color: var(--text-secondary); font-size: 0.85rem;">None</span>`;
  }

  // ==========================================
  // Reporting Portal (Airtable-style Live Grid)
  // ==========================================
  const reportingForm = document.getElementById('reportingForm');
  const airtableGridBody = document.querySelector('#airtableGrid tbody');
  const recordCountSpan = document.getElementById('recordCount');
  const filterReportingSeason = document.getElementById('filterReportingSeason');

  // Photo Dropzone, Counter, and File Picker
  let selectedPhotoFiles = [];
  const photoFileInput = document.getElementById('r-photos');
  const photoDropzone = document.getElementById('photoDropzone');
  const photoPreviewGrid = document.getElementById('photoPreviewGrid');
  const photoBatchCounter = document.getElementById('photoBatchCounter');
  const photoActionRow = document.getElementById('photoActionRow');
  const btnClearPhotos = document.getElementById('btnClearPhotos');

  function renderPhotoPreviews() {
    if (!photoPreviewGrid) return;
    photoPreviewGrid.innerHTML = '';
    
    if (selectedPhotoFiles.length > 0) {
      if (photoBatchCounter) {
        photoBatchCounter.style.display = 'inline';
        const estKb = Math.round(selectedPhotoFiles.length * 40);
        photoBatchCounter.textContent = `📸 ${selectedPhotoFiles.length} photo${selectedPhotoFiles.length > 1 ? 's' : ''} ready (~${estKb} KB)`;
      }
      if (photoActionRow) photoActionRow.style.display = 'flex';
    } else {
      if (photoBatchCounter) photoBatchCounter.style.display = 'none';
      if (photoActionRow) photoActionRow.style.display = 'none';
    }

    selectedPhotoFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'photo-preview-item';
      
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      item.appendChild(img);

      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-preview';
      btnRemove.innerHTML = '&times;';
      btnRemove.onclick = (e) => {
        e.stopPropagation();
        selectedPhotoFiles.splice(index, 1);
        renderPhotoPreviews();
      };
      item.appendChild(btnRemove);

      photoPreviewGrid.appendChild(item);
    });
  }

  if (btnClearPhotos) {
    btnClearPhotos.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedPhotoFiles = [];
      if (photoFileInput) photoFileInput.value = '';
      renderPhotoPreviews();
    });
  }

  // Quick Date Buttons
  const btnQuickDateToday = document.getElementById('btnQuickDateToday');
  const btnQuickDateYesterday = document.getElementById('btnQuickDateYesterday');
  const rDateInput = document.getElementById('r-date');

  if (btnQuickDateToday && rDateInput) {
    btnQuickDateToday.addEventListener('click', () => {
      rDateInput.value = new Date().toISOString().split('T')[0];
      saveFormDraft();
    });
  }

  if (btnQuickDateYesterday && rDateInput) {
    btnQuickDateYesterday.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      rDateInput.value = d.toISOString().split('T')[0];
      saveFormDraft();
    });
  }

  // Draft Auto-Save System
  const draftBadge = document.getElementById('draftStatusBadge');
  function saveFormDraft() {
    const draft = {
      date: document.getElementById('r-date')?.value || '',
      type: document.getElementById('r-type')?.value || '',
      topic: document.getElementById('r-topic')?.value || '',
      status: document.getElementById('r-status')?.value || 'N/A',
      story: document.getElementById('r-story')?.value || '',
      photoLink: document.getElementById('r-photo-link')?.value || ''
    };
    try {
      localStorage.setItem('wkkf_reporting_draft', JSON.stringify(draft));
      if (draftBadge && (draft.topic || draft.story)) {
        draftBadge.style.display = 'inline';
      }
    } catch (e) {}
  }

  function restoreFormDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem('wkkf_reporting_draft'));
      if (saved) {
        if (saved.date) document.getElementById('r-date').value = saved.date;
        if (saved.type) document.getElementById('r-type').value = saved.type;
        if (saved.topic) document.getElementById('r-topic').value = saved.topic;
        if (saved.status) document.getElementById('r-status').value = saved.status;
        if (saved.story) document.getElementById('r-story').value = saved.story;
        if (saved.photoLink) document.getElementById('r-photo-link').value = saved.photoLink;
        if (draftBadge && (saved.topic || saved.story)) {
          draftBadge.style.display = 'inline';
        }
      }
    } catch (e) {}
  }

  // Bind draft auto-saving
  ['r-date', 'r-type', 'r-topic', 'r-status', 'r-story', 'r-photo-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', saveFormDraft);
      el.addEventListener('change', saveFormDraft);
    }
  });

  restoreFormDraft();

  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach(f => {
          if (f.type.startsWith('image/')) selectedPhotoFiles.push(f);
        });
        renderPhotoPreviews();
      }
    });
  }

  if (photoDropzone) {
    ['dragenter', 'dragover'].forEach(name => {
      photoDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        photoDropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      photoDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        photoDropzone.classList.remove('dragover');
      });
    });
    photoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoDropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        Array.from(e.dataTransfer.files).forEach(f => {
          if (f.type.startsWith('image/')) selectedPhotoFiles.push(f);
        });
        renderPhotoPreviews();
      }
    });
  }

  function renderReportsGrid() {
    if (!airtableGridBody) return;
    airtableGridBody.innerHTML = '';
    
    const filteredReports = reports.filter(r => {
      if (currentSeasonFilter === 'all') return true;
      return getSeasonFromDate(r.date) === currentSeasonFilter;
    });

    filteredReports.forEach(record => {
      const tr = document.createElement('tr');
      const attendeeCount = record.attendees ? record.attendees.length : 0;
      const attendeeNames = record.attendees ? record.attendees.map(a => a.name || 'Unnamed').filter(Boolean).join(', ') : 'N/A';
      
      tr.innerHTML = `
        <td>${record.date || 'N/A'}</td>
        <td><span class="tag tag-active">${record.type || 'General'}</span></td>
        <td><strong>${record.topic || 'N/A'}</strong></td>
        <td>
          <div title="${attendeeNames}"><strong>👤 ${attendeeCount} Attendee${attendeeCount !== 1 ? 's' : ''}</strong></div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${attendeeNames}
          </div>
        </td>
        <td>${record.status || 'N/A'}</td>
        <td title="${record.story || ''}">${record.story ? record.story.substring(0, 35) + '...' : 'None'}</td>
        <td>${renderPhotoCell(record)}</td>
      `;
      airtableGridBody.appendChild(tr);
    });

    if (recordCountSpan) {
      recordCountSpan.textContent = `${filteredReports.length} Record${filteredReports.length !== 1 ? 's' : ''}`;
    }

    updateCalendarLiveFeeds();
    updateCompiledReport();
  }

  if (filterReportingSeason) {
    filterReportingSeason.addEventListener('change', (e) => {
      currentSeasonFilter = e.target.value;
      renderReportsGrid();
    });
  }

  // Update Live Calendar Month Feeds
  function updateCalendarLiveFeeds() {
    const seasonMap = {
      'summer-2026': document.getElementById('season-events-summer2026'),
      'fall-2026': document.getElementById('season-events-fall2026'),
      'winter-2026': document.getElementById('season-events-winter2026'),
      'spring-2027': document.getElementById('season-events-spring2027'),
      'summer-2027': document.getElementById('season-events-summer2027')
    };

    Object.values(seasonMap).forEach(container => {
      if (container) container.innerHTML = '';
    });

    reports.forEach(r => {
      const season = getSeasonFromDate(r.date);
      const targetContainer = seasonMap[season];
      if (targetContainer) {
        const attendeeCount = r.attendees ? r.attendees.length : 0;
        const chip = document.createElement('div');
        chip.className = 'season-event-chip';
        chip.innerHTML = `
          <span><strong>${r.date}:</strong> ${r.topic} (${r.type})</span>
          <span>👥 ${attendeeCount}</span>
        `;
        targetContainer.appendChild(chip);
      }
    });
  }

  // Initial render
  renderReportsGrid();

  // Live Firestore listener for Reports
  if (db) {
    db.collection('wkkf_reports').onSnapshot((snapshot) => {
      const liveRecords = [];
      snapshot.forEach(doc => {
        liveRecords.push({ id: doc.id, ...doc.data() });
      });

      liveRecords.sort((a, b) => {
        const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : new Date(a.date || 0).getTime();
        const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.date || 0).getTime()) : new Date(b.date || 0).getTime();
        return timeB - timeA;
      });

      reports = liveRecords;
      setCachedData('wkkf_reports', reports);
      renderReportsGrid();
      updateSyncStatus(true, 'Live Cloud Sync Active');
    }, (err) => {
      console.warn("Reports live listener warning:", err);
      updateSyncStatus(false, 'Local Storage (Offline)');
    });
  }

  // Attendee Tabs Logic
  const attendeeTabs = document.querySelectorAll('.attendee-tab');
  const attendeeContents = document.querySelectorAll('.attendee-content');
  
  attendeeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      attendeeTabs.forEach(t => t.classList.remove('active'));
      attendeeContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabTarget = document.getElementById('tab-' + tab.getAttribute('data-tab'));
      if (tabTarget) tabTarget.classList.add('active');
    });
  });

  const btnAddAttendee = document.getElementById('btnAddAttendee');
  const attendeeTableBody = document.querySelector('#attendeeTable tbody');

  function addAttendeeRow() {
    if (!attendeeTableBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="att-name" placeholder="Name"></td>
      <td><input type="text" class="att-phone" placeholder="Phone"></td>
      <td><input type="email" class="att-email" placeholder="Email"></td>
      <td><input type="text" class="att-farm" placeholder="Location"></td>
      <td><button type="button" class="btn-remove-row" title="Remove row">×</button></td>
    `;
    tr.querySelector('.btn-remove-row').addEventListener('click', () => tr.remove());
    attendeeTableBody.appendChild(tr);
  }
  
  if (btnAddAttendee) {
    btnAddAttendee.addEventListener('click', addAttendeeRow);
    addAttendeeRow();
  }

  // Handle Reporting Form Submission
  if (reportingForm) {
    reportingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = reportingForm.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Record...';
      }

      let attendeesList = [];
      const activeTabEl = document.querySelector('.attendee-tab.active');
      const activeTab = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'manual';
      
      if (activeTab === 'manual') {
        const rows = attendeeTableBody ? attendeeTableBody.querySelectorAll('tr') : [];
        rows.forEach(row => {
          const nameInput = row.querySelector('.att-name');
          const name = nameInput ? nameInput.value.trim() : '';
          if (name) {
            attendeesList.push({
              name: name,
              phone: row.querySelector('.att-phone')?.value.trim() || '',
              email: row.querySelector('.att-email')?.value.trim() || '',
              location: row.querySelector('.att-farm')?.value.trim() || ''
            });
          }
        });
      } else {
        const bulkData = document.getElementById('r-bulk-attendees')?.value.trim() || '';
        if (bulkData) {
          const lines = bulkData.split('\n');
          lines.forEach(line => {
            const cols = line.split('\t');
            if (cols.length > 0 && cols[0].trim()) {
              attendeesList.push({
                name: cols[0] ? cols[0].trim() : '',
                phone: cols[1] ? cols[1].trim() : '',
                email: cols[2] ? cols[2].trim() : '',
                location: cols[3] ? cols[3].trim() : ''
              });
            }
          });
        }
      }

      const uploadProgressBox = document.getElementById('uploadProgressBox');
      const uploadProgressBarFill = document.getElementById('uploadProgressBarFill');
      const uploadProgressText = document.getElementById('uploadProgressText');

      if (uploadProgressBox) {
        uploadProgressBox.style.display = 'block';
        if (uploadProgressBarFill) uploadProgressBarFill.style.width = '5%';
        if (uploadProgressText) uploadProgressText.textContent = 'Preparing submission...';
      }

      function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const uploadedPhotoUrls = [];
      const totalPhotos = selectedPhotoFiles.length;

      if (totalPhotos > 0) {
        for (let i = 0; i < totalPhotos; i++) {
          const rawFile = selectedPhotoFiles[i];
          const pct = Math.round(((i + 1) / totalPhotos) * 85);

          if (submitBtn) submitBtn.textContent = `Processing Photo ${i + 1}/${totalPhotos}...`;
          if (uploadProgressBarFill) uploadProgressBarFill.style.width = `${pct}%`;
          if (uploadProgressText) uploadProgressText.textContent = `Optimizing & saving photo ${i + 1} of ${totalPhotos}...`;

          try {
            // Auto compress image to ~35KB to guarantee ultra-fast batch uploads
            const file = await compressImage(rawFile, 960, 960, 0.65);

            if (typeof firebase !== 'undefined' && firebase.storage) {
              const safeName = (file.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
              const storageRef = firebase.storage().ref('event_photos/' + Date.now() + '_' + safeName);
              const snapshot = await storageRef.put(file);
              const downloadUrl = await snapshot.ref.getDownloadURL();
              uploadedPhotoUrls.push(downloadUrl);
            } else {
              const base64 = await readFileAsDataUrl(file);
              uploadedPhotoUrls.push(base64);
            }
          } catch (storageErr) {
            console.warn("Storage upload fallback for file:", storageErr);
            try {
              const compressedFile = await compressImage(rawFile, 720, 720, 0.55);
              const base64 = await readFileAsDataUrl(compressedFile);
              uploadedPhotoUrls.push(base64);
            } catch (readErr) {
              console.error("Failed to read image file:", readErr);
            }
          }
        }
      }

      if (uploadProgressBarFill) uploadProgressBarFill.style.width = '95%';
      if (uploadProgressText) uploadProgressText.textContent = 'Finalizing & syncing record...';
      if (submitBtn) submitBtn.textContent = 'Saving Record...';

      const rawPhotoLink = document.getElementById('r-photo-link')?.value.trim() || '';

      const newRecord = {
        date: document.getElementById('r-date')?.value || new Date().toISOString().split('T')[0],
        type: document.getElementById('r-type')?.value || 'Workshop',
        topic: document.getElementById('r-topic')?.value || '',
        status: document.getElementById('r-status')?.value || 'N/A',
        story: document.getElementById('r-story')?.value || '',
        photoLink: rawPhotoLink || (uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : ''),
        photos: uploadedPhotoUrls,
        attendees: attendeesList
      };

      try {
        if (db) {
          await db.collection('wkkf_reports').add({
            ...newRecord,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          showToast(`Record with ${uploadedPhotoUrls.length} photos synced to cloud!`, "success");
        } else {
          reports.unshift(newRecord);
          setCachedData('wkkf_reports', reports);
          renderReportsGrid();
          showToast("Saved locally in browser (Offline Mode).", "warning");
        }

        // Clear Form & Draft
        reportingForm.reset();
        selectedPhotoFiles = [];
        renderPhotoPreviews();
        try {
          localStorage.removeItem('wkkf_reporting_draft');
          if (draftBadge) draftBadge.style.display = 'none';
        } catch (e) {}

        if (attendeeTableBody) {
          attendeeTableBody.innerHTML = '';
          addAttendeeRow();
        }
      } catch (err) {
        console.error("Error submitting report to Firestore:", err);
        reports.unshift(newRecord);
        setCachedData('wkkf_reports', reports);
        renderReportsGrid();
        showToast("Saved locally — cloud sync pending (" + (err.code || "restricted") + ")", "warning");
      } finally {
        if (uploadProgressBox) uploadProgressBox.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Record';
        }
      }
    });
  }

  // ==========================================
  // Target Surveys & KPIs (Live & Cached)
  // ==========================================
  const surveyTabsBtn = document.querySelectorAll('.survey-tab');
  const surveyPanels = document.querySelectorAll('.survey-panel');
  
  surveyTabsBtn.forEach(tab => {
    tab.addEventListener('click', () => {
      surveyTabsBtn.forEach(t => t.classList.remove('active'));
      surveyPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const targetPanel = document.getElementById(tab.getAttribute('data-target'));
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  function renderSurveyGrid(key, tbodyId, countId, rowRenderer) {
    const data = getCachedData(key);
    const tbody = document.querySelector(`#${tbodyId} tbody`);
    if (tbody) {
      tbody.innerHTML = '';
      data.forEach(item => tbody.appendChild(rowRenderer(item)));
    }
    const countSpan = document.getElementById(countId);
    if (countSpan) countSpan.textContent = data.length;
    updateCompiledReport();
  }

  const renderMarket = () => renderSurveyGrid(SURVEY_KEYS.market, 'gridMarket', 'count-market', (r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date || 'N/A'}</td><td>${r.location || 'N/A'}</td><td>${r.used || 'N/A'}</td><td>${r.amount ? '$'+r.amount : 'N/A'}</td><td>${r.first || 'N/A'}</td>`;
    return tr;
  });

  const renderMall = () => renderSurveyGrid(SURVEY_KEYS.mall, 'gridMall', 'count-mall', (r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date || 'N/A'}</td><td>${r.location || 'N/A'}</td><td>${r.zip || 'N/A'}</td><td>${r.learned || 'N/A'}</td><td>${r.materials || 'None'}</td>`;
    return tr;
  });

  const renderCsa = () => renderSurveyGrid(SURVEY_KEYS.csa, 'gridCsa', 'count-csa', (r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date || 'N/A'}</td><td>${r.city || 'N/A'}</td><td>${r.size || 'N/A'}</td><td>${r.enrolled || 'N/A'}</td>`;
    return tr;
  });

  const renderFarmer = () => renderSurveyGrid(SURVEY_KEYS.farmer, 'gridFarmer', 'count-farmer', (r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date || 'N/A'}</td><td>${r.name || 'N/A'}</td><td>${r.size || 'N/A'}</td><td title="${r.topics || ''}">${(r.topics || '').substring(0, 20)}...</td><td title="${r.barriers || ''}">${r.barriers ? r.barriers.substring(0, 20) + '...' : 'None'}</td>`;
    return tr;
  });

  // Initial renders
  renderMarket(); renderMall(); renderCsa(); renderFarmer();

  if (db) {
    const surveyConfigs = [
      { key: SURVEY_KEYS.market, renderer: renderMarket },
      { key: SURVEY_KEYS.mall, renderer: renderMall },
      { key: SURVEY_KEYS.csa, renderer: renderCsa },
      { key: SURVEY_KEYS.farmer, renderer: renderFarmer }
    ];

    surveyConfigs.forEach(({ key, renderer }) => {
      db.collection(key).onSnapshot((snapshot) => {
        const liveData = [];
        snapshot.forEach(doc => liveData.push({ id: doc.id, ...doc.data() }));
        
        liveData.sort((a, b) => {
          const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : new Date(a.date || 0).getTime();
          const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.date || 0).getTime()) : new Date(b.date || 0).getTime();
          return timeB - timeA;
        });

        setCachedData(key, liveData);
        renderer();
      }, (err) => {
        console.warn(`Survey live listener warning for ${key}:`, err);
      });
    });
  }

  const bindSurveyForm = (formId, key, extractor, renderer) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      const newRecord = extractor();

      try {
        if (db) {
          await db.collection(key).add({
            ...newRecord,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          showToast("Survey entry saved & synced to cloud!", "success");
        } else {
          const localData = getCachedData(key);
          localData.unshift(newRecord);
          setCachedData(key, localData);
          renderer();
          showToast("Saved survey locally (Offline Mode).", "warning");
        }

        form.reset();
      } catch (err) {
        console.error(`Error saving survey to ${key}:`, err);
        const localData = getCachedData(key);
        localData.unshift(newRecord);
        setCachedData(key, localData);
        renderer();
        showToast("Saved locally — cloud permission warning (" + (err.code || "offline") + ")", "warning");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Survey';
        }
      }
    });
  };

  bindSurveyForm('formMarket', SURVEY_KEYS.market, () => ({
    date: document.getElementById('sm-date')?.value || new Date().toISOString().split('T')[0],
    location: document.getElementById('sm-location')?.value || '',
    used: document.getElementById('sm-used')?.value || 'Yes',
    amount: document.getElementById('sm-amount')?.value || '',
    first: document.getElementById('sm-first')?.value || 'No'
  }), renderMarket);

  bindSurveyForm('formMall', SURVEY_KEYS.mall, () => ({
    date: document.getElementById('sl-date')?.value || new Date().toISOString().split('T')[0],
    location: document.getElementById('sl-location')?.value || '',
    zip: document.getElementById('sl-zip')?.value || '',
    learned: document.getElementById('sl-learned')?.value || 'Yes',
    materials: document.getElementById('sl-materials')?.value || ''
  }), renderMall);

  bindSurveyForm('formCsa', SURVEY_KEYS.csa, () => ({
    date: document.getElementById('sc-date')?.value || new Date().toISOString().split('T')[0],
    city: document.getElementById('sc-city')?.value || '',
    size: document.getElementById('sc-size')?.value || '',
    enrolled: document.getElementById('sc-enrolled')?.value || 'Yes'
  }), renderCsa);

  bindSurveyForm('formFarmer', SURVEY_KEYS.farmer, () => ({
    date: document.getElementById('sf-date')?.value || new Date().toISOString().split('T')[0],
    name: document.getElementById('sf-name')?.value || '',
    size: document.getElementById('sf-size')?.value || '',
    topics: document.getElementById('sf-topics')?.value || '',
    barriers: document.getElementById('sf-barriers')?.value || ''
  }), renderFarmer);

  // ==========================================
  // Compiled Executive Report Calculations
  // ==========================================
  function updateCompiledReport() {
    const marketSurveys = getCachedData(SURVEY_KEYS.market);
    const mallSurveys = getCachedData(SURVEY_KEYS.mall);
    const csaSurveys = getCachedData(SURVEY_KEYS.csa);
    const farmerSurveys = getCachedData(SURVEY_KEYS.farmer);

    // 1. Trainings count & attendees
    const trainingsCount = reports.length;
    let totalAttendees = 0;
    const attendeeSet = new Set();
    reports.forEach(r => {
      if (r.attendees && Array.isArray(r.attendees)) {
        totalAttendees += r.attendees.length;
        r.attendees.forEach(a => {
          if (a.name) attendeeSet.add(a.name.trim().toLowerCase());
        });
      }
    });

    const elTrainingsCount = document.getElementById('kpi-trainings-count');
    const elTrainingsBar = document.getElementById('kpi-trainings-bar');
    const elAttendeesTotal = document.getElementById('kpi-attendees-total');
    if (elTrainingsCount) elTrainingsCount.textContent = trainingsCount;
    if (elTrainingsBar) elTrainingsBar.style.width = Math.min(100, Math.round((trainingsCount / 10) * 100)) + '%';
    if (elAttendeesTotal) elAttendeesTotal.textContent = totalAttendees;

    // 2. Graduates
    const graduatesCount = attendeeSet.size;
    const elGraduatesCount = document.getElementById('kpi-graduates-count');
    const elGraduatesBar = document.getElementById('kpi-graduates-bar');
    if (elGraduatesCount) elGraduatesCount.textContent = graduatesCount;
    if (elGraduatesBar) elGraduatesBar.style.width = Math.min(100, Math.round((graduatesCount / 20) * 100)) + '%';

    // 3. SNAP / DUFB Families
    const snapFamilies = marketSurveys.length;
    let totalSnapDollars = 0;
    marketSurveys.forEach(s => {
      if (s.amount) {
        const val = parseFloat(s.amount);
        if (!isNaN(val)) totalSnapDollars += val;
      }
    });
    const elSnapFamilies = document.getElementById('kpi-snap-families');
    const elSnapBar = document.getElementById('kpi-snap-bar');
    const elSnapDollars = document.getElementById('kpi-snap-dollars');
    if (elSnapFamilies) elSnapFamilies.textContent = snapFamilies;
    if (elSnapBar) elSnapBar.style.width = Math.min(100, Math.round((snapFamilies / 30) * 100)) + '%';
    if (elSnapDollars) elSnapDollars.textContent = `$${totalSnapDollars.toFixed(2)}`;

    // 4. MALL Outreach Reach
    const mallCount = mallSurveys.length;
    const mallLocations = new Set();
    mallSurveys.forEach(s => {
      if (s.location) mallLocations.add(s.location.trim().toLowerCase());
    });
    const elMallCount = document.getElementById('kpi-mall-count');
    const elMallBar = document.getElementById('kpi-mall-bar');
    const elMallLocations = document.getElementById('kpi-mall-locations');
    if (elMallCount) elMallCount.textContent = mallCount;
    if (elMallBar) elMallBar.style.width = Math.min(100, Math.round((mallCount / 80) * 100)) + '%';
    if (elMallLocations) elMallLocations.textContent = mallLocations.size;

    // 5. CSA Distribution Reach
    const csaCities = new Set();
    let totalCsaHouseholds = 0;
    csaSurveys.forEach(s => {
      if (s.city) csaCities.add(s.city.trim().toLowerCase());
      if (s.size) {
        const val = parseInt(s.size, 10);
        if (!isNaN(val)) totalCsaHouseholds += val;
      } else {
        totalCsaHouseholds += 1;
      }
    });
    const elCsaCities = document.getElementById('kpi-csa-cities');
    const elCsaBar = document.getElementById('kpi-csa-bar');
    const elCsaHouseholds = document.getElementById('kpi-csa-households');
    if (elCsaCities) elCsaCities.textContent = csaCities.size;
    if (elCsaBar) elCsaBar.style.width = Math.min(100, Math.round((csaCities.size / 5) * 100)) + '%';
    if (elCsaHouseholds) elCsaHouseholds.textContent = totalCsaHouseholds;

    // 6. Farmer TA
    const farmerCount = farmerSurveys.length;
    const elFarmerCount = document.getElementById('kpi-farmer-count');
    const elFarmerBar = document.getElementById('kpi-farmer-bar');
    if (elFarmerCount) elFarmerCount.textContent = farmerCount;
    if (elFarmerBar) elFarmerBar.style.width = Math.min(100, Math.round((farmerCount / 10) * 100)) + '%';

    // 7. Monthly Aggregated Summary Breakdown Table
    const monthlySummaryBody = document.querySelector('#compiledMonthlyTable tbody');
    if (monthlySummaryBody) {
      monthlySummaryBody.innerHTML = '';
      const monthsMap = {};

      const recordMonths = [...reports, ...marketSurveys, ...mallSurveys, ...csaSurveys, ...farmerSurveys];
      recordMonths.forEach(item => {
        const m = formatMonthName(item.date);
        if (m !== 'N/A' && !monthsMap[m]) {
          monthsMap[m] = { month: m, events: 0, attendees: 0, snap: 0, mall: 0, farmer: 0 };
        }
      });

      reports.forEach(r => {
        const m = formatMonthName(r.date);
        if (monthsMap[m]) {
          monthsMap[m].events += 1;
          if (r.attendees) monthsMap[m].attendees += r.attendees.length;
        }
      });
      marketSurveys.forEach(s => {
        const m = formatMonthName(s.date);
        if (monthsMap[m]) monthsMap[m].snap += 1;
      });
      mallSurveys.forEach(s => {
        const m = formatMonthName(s.date);
        if (monthsMap[m]) monthsMap[m].mall += 1;
      });
      farmerSurveys.forEach(s => {
        const m = formatMonthName(s.date);
        if (monthsMap[m]) monthsMap[m].farmer += 1;
      });

      const monthList = Object.values(monthsMap);
      if (monthList.length === 0) {
        monthlySummaryBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No activity data recorded yet.</td></tr>`;
      } else {
        monthList.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${item.month}</strong></td>
            <td><span class="tag tag-active">${item.events} Events</span></td>
            <td>👥 ${item.attendees} Attendees</td>
            <td>🥦 ${item.snap} Families</td>
            <td>🚌 ${item.mall} Individuals</td>
            <td>👩‍🌾 ${item.farmer} Sessions</td>
          `;
          monthlySummaryBody.appendChild(tr);
        });
      }
    }

    // 8. Master Activities & Surveys Log Table
    const masterLogBody = document.querySelector('#masterLogTable tbody');
    const masterLogCount = document.getElementById('masterLogCount');
    if (masterLogBody) {
      masterLogBody.innerHTML = '';
      const allEntries = [];

      reports.forEach(r => {
        const count = r.attendees ? r.attendees.length : 0;
        const names = r.attendees ? r.attendees.map(a => a.name).filter(Boolean).join(', ') : '';
        allEntries.push({
          date: r.date || 'N/A',
          category: `Activity (${r.type || 'Event'})`,
          focus: r.topic || 'N/A',
          topic: r.topic || '',
          participants: `${count} Attendee${count !== 1 ? 's' : ''}${names ? ': ' + names : ''}`,
          details: r.story || r.status || 'Completed',
          photoLink: r.photoLink || '',
          photos: r.photos || []
        });
      });

      marketSurveys.forEach(s => {
        allEntries.push({
          date: s.date || 'N/A',
          category: 'Market Survey',
          focus: s.location || 'Farmers Market',
          topic: s.location || '',
          participants: `SNAP/DUFB Used: ${s.used || 'Yes'}`,
          details: `Amount: $${s.amount || '0'} | First-time: ${s.first || 'No'}`,
          photoLink: '',
          photos: []
        });
      });

      mallSurveys.forEach(s => {
        allEntries.push({
          date: s.date || 'N/A',
          category: 'MALL Outreach',
          focus: s.location || 'Mobile Lab',
          topic: s.location || '',
          participants: `Zip: ${s.zip || 'N/A'}`,
          details: `Learned: ${s.learned || 'Yes'} | Materials: ${s.materials || 'None'}`,
          photoLink: '',
          photos: []
        });
      });

      csaSurveys.forEach(s => {
        allEntries.push({
          date: s.date || 'N/A',
          category: 'CSA Distribution',
          focus: `City: ${s.city || 'N/A'}`,
          topic: s.city || '',
          participants: `Household Size: ${s.size || 'N/A'}`,
          details: `SNAP/WIC: ${s.enrolled || 'Yes'}`,
          photoLink: '',
          photos: []
        });
      });

      farmerSurveys.forEach(s => {
        allEntries.push({
          date: s.date || 'N/A',
          category: 'Farmer 1-on-1 TA',
          focus: s.name || 'Farmer',
          topic: s.name || '',
          participants: `Op Size: ${s.size || 'N/A'}`,
          details: `Topics: ${s.topics || 'Wholesale'} | Barriers: ${s.barriers || 'None'}`,
          photoLink: '',
          photos: []
        });
      });

      allEntries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      if (masterLogCount) {
        masterLogCount.textContent = `${allEntries.length} Total Entries`;
      }

      if (allEntries.length === 0) {
        masterLogBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No master log records available.</td></tr>`;
      } else {
        allEntries.forEach(entry => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${entry.date}</td>
            <td><span class="tag tag-primary">${entry.category}</span></td>
            <td><strong>${entry.focus}</strong></td>
            <td style="max-width: 200px; font-size: 0.8rem;">${entry.participants}</td>
            <td style="max-width: 250px; font-size: 0.8rem;">${entry.details}</td>
            <td>${renderPhotoCell(entry)}</td>
          `;
          masterLogBody.appendChild(tr);
        });
      }
    }
  }

  // ==========================================
  // CSV Export Functions
  // ==========================================
  function downloadCsvFile(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const btnExportReportsCsv = document.getElementById('btnExportReportsCsv');
  if (btnExportReportsCsv) {
    btnExportReportsCsv.addEventListener('click', () => {
      let csv = 'Date,Activity Type,Topic,Attendee Count,Attendee Names,Organic Status,Impact Story,Photo Link\n';
      reports.forEach(r => {
        const count = r.attendees ? r.attendees.length : 0;
        const names = r.attendees ? r.attendees.map(a => `${a.name} (${a.location || ''})`).join('; ') : '';
        const row = [
          `"${r.date || ''}"`,
          `"${r.type || ''}"`,
          `"${(r.topic || '').replace(/"/g, '""')}"`,
          count,
          `"${names.replace(/"/g, '""')}"`,
          `"${r.status || ''}"`,
          `"${(r.story || '').replace(/"/g, '""')}"`,
          `"${r.photoLink || ''}"`
        ];
        csv += row.join(',') + '\n';
      });
      downloadCsvFile(csv, `Kellogg_Project_Workbook_${new Date().toISOString().split('T')[0]}.csv`);
    });
  }

  const btnExportAllCsv = document.getElementById('btnExportAllCsv');
  if (btnExportAllCsv) {
    btnExportAllCsv.addEventListener('click', () => {
      let csv = 'Record Type,Date,Location/City/Name,Category/Topic,Detail 1,Detail 2,Detail 3\n';
      
      reports.forEach(r => {
        const names = r.attendees ? r.attendees.map(a => a.name).join('; ') : '';
        csv += `"Activity Event","${r.date || ''}","${r.status || ''}","${(r.topic || '').replace(/"/g, '""')}","Attendees: ${r.attendees ? r.attendees.length : 0}","${names.replace(/"/g, '""')}","${r.photoLink || ''}"\n`;
      });

      const marketSurveys = getCachedData(SURVEY_KEYS.market);
      marketSurveys.forEach(s => {
        csv += `"Market Survey","${s.date || ''}","${s.location || ''}","SNAP/DUFB: ${s.used || 'Yes'}","Amount: $${s.amount || '0'}","First-Time: ${s.first || 'No'}",""\n`;
      });

      const mallSurveys = getCachedData(SURVEY_KEYS.mall);
      mallSurveys.forEach(s => {
        csv += `"MALL Outreach","${s.date || ''}","${s.location || ''}","Zip: ${s.zip || ''}","Learned: ${s.learned || 'Yes'}","Materials: ${(s.materials || '').replace(/"/g, '""')}",""\n`;
      });

      const csaSurveys = getCachedData(SURVEY_KEYS.csa);
      csaSurveys.forEach(s => {
        csv += `"CSA Distribution","${s.date || ''}","${s.city || ''}","Household Size: ${s.size || ''}","SNAP/WIC: ${s.enrolled || 'Yes'}","",""\n`;
      });

      const farmerSurveys = getCachedData(SURVEY_KEYS.farmer);
      farmerSurveys.forEach(s => {
        csv += `"Farmer TA","${s.date || ''}","${s.name || ''}","Size: ${s.size || ''}","Topics: ${(s.topics || '').replace(/"/g, '""')}","Barriers: ${(s.barriers || '').replace(/"/g, '""')}",""\n`;
      });

      downloadCsvFile(csv, `WK_Kellogg_Compiled_Grant_Report_${new Date().toISOString().split('T')[0]}.csv`);
    });
  }

  // ==========================================
  // Live Countdown Timers
  // ==========================================
  const timers = document.querySelectorAll('.countdown-timer');
  
  function updateTimers() {
    const now = new Date();
    
    timers.forEach(timer => {
      const targetDateStr = timer.getAttribute('data-target-date');
      if (!targetDateStr) return;
      
      const targetDate = new Date(targetDateStr);
      const diff = targetDate - now;
      
      const clockIcon = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

      if (diff <= 0) {
        timer.innerHTML = `${clockIcon} Past Due`;
        timer.className = 'countdown-timer status-danger';
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      
      let statusClass = 'status-safe';
      if (days < 30) {
        statusClass = 'status-danger';
      } else if (days < 90) {
        statusClass = 'status-warning';
      }
      
      timer.className = `countdown-timer ${statusClass}`;
      timer.innerHTML = `${clockIcon} ${days}d ${hours}h left`;
    });
  }
  
  updateTimers();
  setInterval(updateTimers, 60000);

  // Initial compiled report trigger
  updateCompiledReport();

});


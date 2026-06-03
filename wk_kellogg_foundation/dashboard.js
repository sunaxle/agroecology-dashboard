document.addEventListener('DOMContentLoaded', () => {
  
  // Tab Navigation Logic
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links and sections
      navLinks.forEach(l => l.classList.remove('active'));
      viewSections.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Show corresponding section
      const targetId = link.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Local Storage Logic for Checkboxes
  const checkboxes = document.querySelectorAll('.checkbox');
  
  // Load saved state
  checkboxes.forEach(checkbox => {
    const savedState = localStorage.getItem(`wkkf_chk_${checkbox.id}`);
    if (savedState === 'true') {
      checkbox.checked = true;
    }
    
    // Listen for changes and save
    checkbox.addEventListener('change', (e) => {
      localStorage.setItem(`wkkf_chk_${checkbox.id}`, e.target.checked);
    });
  });

  // ==========================================
  // Reporting Portal Logic
  // ==========================================
  const reportingForm = document.getElementById('reportingForm');
  const airtableGridBody = document.querySelector('#airtableGrid tbody');
  const recordCountSpan = document.getElementById('recordCount');

  // Load existing records from local storage
  let records = JSON.parse(localStorage.getItem('wkkf_reports')) || [];

  function renderGrid() {
    airtableGridBody.innerHTML = '';
    records.forEach(record => {
      const tr = document.createElement('tr');
      const attendeeCount = record.attendees ? record.attendees.length : 0;
      const attendeeNames = record.attendees ? record.attendees.map(a => a.name).join(', ') : 'N/A';
      
      tr.innerHTML = `
        <td>${record.date}</td>
        <td><span class="tag tag-active">${record.type}</span></td>
        <td>${record.topic}</td>
        <td>
          <div title="${attendeeNames}"><strong>👤 ${attendeeCount} Attendee${attendeeCount !== 1 ? 's' : ''}</strong></div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${attendeeNames}
          </div>
        </td>
        <td>${record.status}</td>
        <td title="${record.story}">${record.story ? record.story.substring(0, 30) + '...' : 'None'}</td>
        <td>${record.photoLink ? `<a href="${record.photoLink}" target="_blank" style="color: var(--primary-color); font-weight: 500; font-size: 0.85rem;">View Album</a>` : '<span style="color: var(--text-secondary); font-size: 0.85rem;">None</span>'}</td>
      `;
      airtableGridBody.appendChild(tr);
    });
    recordCountSpan.textContent = `${records.length} Record${records.length !== 1 ? 's' : ''}`;
  }

  // Initial render
  renderGrid();

  // Attendee Tabs Logic
  const attendeeTabs = document.querySelectorAll('.attendee-tab');
  const attendeeContents = document.querySelectorAll('.attendee-content');
  
  attendeeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      attendeeTabs.forEach(t => t.classList.remove('active'));
      attendeeContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.getAttribute('data-tab')).classList.add('active');
    });
  });

  // Manual Attendee Table Logic
  const btnAddAttendee = document.getElementById('btnAddAttendee');
  const attendeeTableBody = document.querySelector('#attendeeTable tbody');

  function addAttendeeRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="att-name" placeholder="Name"></td>
      <td><input type="text" class="att-phone" placeholder="Phone"></td>
      <td><input type="email" class="att-email" placeholder="Email"></td>
      <td><input type="text" class="att-farm" placeholder="Location"></td>
      <td><button type="button" class="btn-remove-row" title="Remove row">×</button></td>
    `;
    tr.querySelector('.btn-remove-row').addEventListener('click', () => {
      tr.remove();
    });
    attendeeTableBody.appendChild(tr);
  }
  
  if (btnAddAttendee) {
    btnAddAttendee.addEventListener('click', addAttendeeRow);
    addAttendeeRow(); // Add one initial empty row
  }

  // Handle Form Submission
  if (reportingForm) {
    reportingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let attendeesList = [];
      const activeTab = document.querySelector('.attendee-tab.active').getAttribute('data-tab');
      
      if (activeTab === 'manual') {
        const rows = attendeeTableBody.querySelectorAll('tr');
        rows.forEach(row => {
          const name = row.querySelector('.att-name').value.trim();
          if (name) {
            attendeesList.push({
              name: name,
              phone: row.querySelector('.att-phone').value.trim(),
              email: row.querySelector('.att-email').value.trim(),
              location: row.querySelector('.att-farm').value.trim()
            });
          }
        });
      } else {
        const bulkData = document.getElementById('r-bulk-attendees').value.trim();
        if (bulkData) {
          const lines = bulkData.split('\\n');
          lines.forEach(line => {
            const cols = line.split('\\t');
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

      const newRecord = {
        date: document.getElementById('r-date').value,
        type: document.getElementById('r-type').value,
        topic: document.getElementById('r-topic').value,
        status: document.getElementById('r-status').value,
        story: document.getElementById('r-story').value,
        photoLink: document.getElementById('r-photo-link').value,
        attendees: attendeesList
      };

      // Add to array and save
      records.unshift(newRecord); // Add to top
      localStorage.setItem('wkkf_reports', JSON.stringify(records));
      
      // Update UI
      renderGrid();
      
      // Reset form (except date maybe, but full reset is standard)
      reportingForm.reset();
      
      // Reset manual table rows
      attendeeTableBody.innerHTML = '';
      addAttendeeRow();
      
      // Optional: show a quick success message (could be a toast, but alert is easy for now)
      // alert('Record successfully submitted to the workbook!');
    });
  }

  // ==========================================
  // Live Countdown Logic
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
  
  // Run once immediately, then every hour (since we don't show seconds/minutes, we only need to update occasionally)
  // Actually, updating every minute is safe and makes it feel "live" if someone leaves it open.
  updateTimers();
  setInterval(updateTimers, 60000);

});

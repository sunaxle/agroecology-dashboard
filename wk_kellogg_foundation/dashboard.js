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
      tr.innerHTML = `
        <td>${record.date}</td>
        <td><span class="tag tag-active">${record.type}</span></td>
        <td>${record.topic}</td>
        <td>
          <div><strong>${record.attendeeName || 'N/A'}</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-secondary)">${record.attendeeContact || ''}</div>
        </td>
        <td>${record.farm || 'N/A'}</td>
        <td>${record.status}</td>
        <td title="${record.story}">${record.story ? record.story.substring(0, 30) + '...' : 'None'}</td>
      `;
      airtableGridBody.appendChild(tr);
    });
    recordCountSpan.textContent = `${records.length} Record${records.length !== 1 ? 's' : ''}`;
  }

  // Initial render
  renderGrid();

  // Handle Form Submission
  if (reportingForm) {
    reportingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newRecord = {
        date: document.getElementById('r-date').value,
        type: document.getElementById('r-type').value,
        topic: document.getElementById('r-topic').value,
        attendeeName: document.getElementById('r-name').value,
        attendeeContact: document.getElementById('r-contact').value,
        farm: document.getElementById('r-farm').value,
        status: document.getElementById('r-status').value,
        story: document.getElementById('r-story').value,
      };

      // Add to array and save
      records.unshift(newRecord); // Add to top
      localStorage.setItem('wkkf_reports', JSON.stringify(records));
      
      // Update UI
      renderGrid();
      
      // Reset form (except date maybe, but full reset is standard)
      reportingForm.reset();
      
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

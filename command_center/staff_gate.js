/**
 * UTRGV Agroecology — Staff Access Gate & Partner Isolation Controller
 * --------------------------------------------------------------------
 * 1. Gates the Master Command Center behind the lightweight UTRGV Staff PIN.
 * 2. Keeps Partner Dashboards (Kellogg, BFRDP) 100% standalone for external
 *    partners, while revealing a discreet "← Staff Command Center" bar ONLY
 *    on browsers unlocked by UTRGV staff.
 */
(function () {
  var STORAGE_KEY = 'utrgv_staff_cc_unlocked_v1';
  var UNLOCK_TOKEN = 'utrgv_2026_verified';
  var STAFF_PIN = '2026';

  function isUnlocked() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === UNLOCK_TOKEN;
    } catch (e) {
      return false;
    }
  }

  function setUnlocked(unlocked) {
    try {
      if (unlocked) {
        window.localStorage.setItem(STORAGE_KEY, UNLOCK_TOKEN);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // Ignore storage quota / private mode restrictions
    }
  }

  var isMasterPage =
    document.documentElement.getAttribute('data-cc-master') === 'true' ||
    /\/command_center\/dashboard\.html/i.test(window.location.pathname);

  // Inject zero-flicker head CSS immediately before body renders
  var styleEl = document.createElement('style');
  styleEl.id = 'utrgv-staff-gate-styles';
  styleEl.textContent = [
    'html.cc-locked, html.cc-locked body {',
    '  background: #07261c !important;',
    '  margin: 0;',
    '  min-height: 100vh;',
    '  overflow: hidden !important;',
    '}',
    'html.cc-locked body > *:not(#ccStaffGateOverlay) {',
    '  display: none !important;',
    '}',
    'html.cc-partner-mode [data-staff-only] {',
    '  display: none !important;',
    '}',
    '#ccStaffGateOverlay {',
    '  position: fixed;',
    '  inset: 0;',
    '  z-index: 99999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  padding: 1.25rem;',
    '  background: radial-gradient(circle at top, #134e3a 0%, #07261c 72%);',
    '  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;',
    '}',
    '.cc-gate-card {',
    '  width: 100%;',
    '  max-width: 410px;',
    '  background: rgba(255, 255, 255, 0.98);',
    '  border-radius: 16px;',
    '  padding: 2rem 1.85rem;',
    '  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);',
    '  border: 1px solid rgba(233, 196, 106, 0.45);',
    '  text-align: center;',
    '}',
    '.cc-gate-badge {',
    '  display: inline-block;',
    '  font-size: 0.7rem;',
    '  font-weight: 800;',
    '  letter-spacing: 0.08em;',
    '  text-transform: uppercase;',
    '  background: #ecfdf5;',
    '  color: #065f46;',
    '  border: 1px solid #a7f3d0;',
    '  padding: 4px 10px;',
    '  border-radius: 999px;',
    '  margin-bottom: 0.85rem;',
    '}',
    '.cc-gate-title {',
    '  margin: 0 0 0.45rem;',
    '  font-size: 1.35rem;',
    '  font-weight: 800;',
    '  color: #0f172a;',
    '}',
    '.cc-gate-sub {',
    '  margin: 0 0 1.35rem;',
    '  font-size: 0.85rem;',
    '  line-height: 1.5;',
    '  color: #475569;',
    '}',
    '.cc-gate-input {',
    '  width: 100%;',
    '  box-sizing: border-box;',
    '  padding: 0.8rem 1rem;',
    '  font-size: 1.35rem;',
    '  font-weight: 700;',
    '  letter-spacing: 0.3em;',
    '  text-align: center;',
    '  border: 2px solid #cbd5e1;',
    '  border-radius: 10px;',
    '  color: #0f172a;',
    '  background: #f8fafc;',
    '  outline: none;',
    '  transition: border-color 0.15s ease, box-shadow 0.15s ease;',
    '}',
    '.cc-gate-input:focus {',
    '  border-color: #1b4332;',
    '  background: #ffffff;',
    '  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.18);',
    '}',
    '.cc-gate-btn {',
    '  margin-top: 0.9rem;',
    '  width: 100%;',
    '  padding: 0.8rem 1rem;',
    '  border: none;',
    '  border-radius: 10px;',
    '  background: linear-gradient(135deg, #1b4332, #2d6a4f);',
    '  color: #ffffff;',
    '  font-size: 0.92rem;',
    '  font-weight: 700;',
    '  cursor: pointer;',
    '  transition: opacity 0.15s ease, transform 0.1s ease;',
    '}',
    '.cc-gate-btn:hover {',
    '  opacity: 0.95;',
    '}',
    '.cc-gate-error {',
    '  min-height: 1.25rem;',
    '  margin-top: 0.65rem;',
    '  font-size: 0.8rem;',
    '  font-weight: 600;',
    '  color: #dc2626;',
    '}',
    '@keyframes ccGateShake {',
    '  0%, 100% { transform: translateX(0); }',
    '  20%, 60% { transform: translateX(-7px); }',
    '  40%, 80% { transform: translateX(7px); }',
    '}',
    '.cc-gate-shake {',
    '  animation: ccGateShake 0.32s ease;',
    '}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(styleEl);

  var unlockedNow = isUnlocked();

  if (isMasterPage) {
    if (!unlockedNow) {
      document.documentElement.classList.add('cc-locked');
    }

    function mountLockSessionButton() {
      var footer = document.querySelector('.sidebar-footer');
      if (!footer || document.getElementById('btnLockStaffSession')) return;
      var lockBtn = document.createElement('button');
      lockBtn.id = 'btnLockStaffSession';
      lockBtn.type = 'button';
      lockBtn.textContent = '🔒 Lock Staff Session';
      lockBtn.title = 'Lock Command Center & hide staff navigation on partner dashboards';
      lockBtn.style.cssText =
        'margin-top:10px; width:100%; padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.22); background:rgba(0,0,0,0.22); color:#d8f3dc; font-size:0.75rem; font-weight:600; cursor:pointer; text-align:left;';
      lockBtn.addEventListener('click', function () {
        setUnlocked(false);
        window.location.reload();
      });
      footer.appendChild(lockBtn);
    }

    function mountGateOverlay() {
      if (document.getElementById('ccStaffGateOverlay')) return;
      var overlay = document.createElement('div');
      overlay.id = 'ccStaffGateOverlay';
      overlay.innerHTML =
        '<div class="cc-gate-card" id="ccGateCard">' +
          '<div class="cc-gate-badge">🔒 UTRGV Agroecology · Internal Staff</div>' +
          '<h1 class="cc-gate-title">Master Command Center</h1>' +
          '<p class="cc-gate-sub">Enter the team passcode to access cross-grant operations, calendar coverage, and internal Hub tasks.</p>' +
          '<form id="ccGateForm" autocomplete="off">' +
            '<input type="password" id="ccGatePinInput" class="cc-gate-input" inputmode="numeric" maxlength="12" placeholder="••••" aria-label="Staff Passcode" required />' +
            '<button type="submit" class="cc-gate-btn">Unlock Command Center →</button>' +
            '<div class="cc-gate-error" id="ccGateError" role="alert"></div>' +
          '</form>' +
        '</div>';
      document.body.appendChild(overlay);

      var form = document.getElementById('ccGateForm');
      var input = document.getElementById('ccGatePinInput');
      var errorEl = document.getElementById('ccGateError');
      var card = document.getElementById('ccGateCard');

      setTimeout(function () {
        if (input) input.focus();
      }, 40);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var entered = (input.value || '').trim();
        if (entered === STAFF_PIN) {
          setUnlocked(true);
          document.documentElement.classList.remove('cc-locked');
          overlay.remove();
          mountLockSessionButton();
        } else {
          errorEl.textContent = 'Incorrect staff passcode. Please try again.';
          input.value = '';
          card.classList.remove('cc-gate-shake');
          void card.offsetWidth;
          card.classList.add('cc-gate-shake');
          input.focus();
        }
      });
    }

    document.addEventListener('DOMContentLoaded', function () {
      if (isUnlocked()) {
        document.documentElement.classList.remove('cc-locked');
        mountLockSessionButton();
      } else {
        mountGateOverlay();
      }
    });
  } else {
    // Partner or Public Portal Page (Kellogg, BFRDP, index.html, whiteboard.html)
    if (!unlockedNow) {
      document.documentElement.classList.add('cc-partner-mode');
    }

    document.addEventListener('DOMContentLoaded', function () {
      var staffNodes = document.querySelectorAll('[data-staff-only]');
      if (!isUnlocked()) {
        // Completely remove staff-only navigation from DOM for external partners
        staffNodes.forEach(function (node) {
          node.remove();
        });
      } else {
        staffNodes.forEach(function (node) {
          var disp = node.getAttribute('data-staff-only');
          node.style.display = disp && disp !== 'true' ? disp : '';
        });
        document.querySelectorAll('[data-staff-lock-btn]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            setUnlocked(false);
            window.location.reload();
          });
        });
      }
    });
  }
})();

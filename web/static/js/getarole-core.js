/**
 * getArole Core Shared Frontend SDK (DRY Principle)
 * Handles Firebase UID detection, localStorage sync, API profile REST calls,
 * and resume upload modal handlers across static pages.
 */

/**
 * Resolves the candidate's unique user identifier from session or localStorage.
 * @returns {string} The active user identifier.
 */
function getFirebaseUID() {
  const sessionUID = sessionStorage.getItem('firebase_uid');
  if (sessionUID) return sessionUID;
  const localUID = localStorage.getItem('firebase_uid');
  if (localUID) return localUID;
  try {
    const userRaw = localStorage.getItem('getarole_user');
    if (userRaw) {
      const parsedUser = JSON.parse(userRaw);
      if (parsedUser && parsedUser.uid) return parsedUser.uid;
    }
  } catch (err) {
    console.warn('[getFirebaseUID] Failed to parse user JSON:', err);
  }
  let userId = localStorage.getItem('getarole_user_id');
  if (!userId) {
    userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('getarole_user_id', userId);
  }
  return userId;
}

/**
 * Saves candidate profile data to Supabase REST API backend.
 * @param {Object} profileData - Candidate demographic & section profile object.
 * @returns {Promise<boolean>} True if save succeeded.
 */
async function apiSaveProfile(profileData) {
  const uid = getFirebaseUID();
  // Atomic sync with getarole_resume_v2
  try {
    const r2Raw = localStorage.getItem('getarole_resume_v2');
    if (r2Raw) {
      const r2 = JSON.parse(r2Raw);
      if (!r2.header) r2.header = {};
      if (profileData.name) r2.header.name = profileData.name;
      if (profileData.first) r2.header.first_name = profileData.first;
      if (profileData.last) r2.header.last_name = profileData.last;
      if (profileData.email) r2.header.email = profileData.email;
      if (profileData.phone) r2.header.phone = profileData.phone;
      if (profileData.headline) r2.header.title = profileData.headline;
      localStorage.setItem('getarole_resume_v2', JSON.stringify(r2));
    }
  } catch (syncErr) {
    console.warn('[apiSaveProfile] Resume V2 header sync notice:', syncErr);
  }

  try {
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
      body: JSON.stringify(profileData)
    });
    return response.ok;
  } catch (err) {
    console.warn('[apiSaveProfile] Save error:', err);
    return false;
  }
}

/**
 * Loads candidate profile data from Supabase REST API backend.
 * @returns {Promise<Object|null>} Candidate profile object or null if not found.
 */
async function apiLoadProfile() {
  const uid = getFirebaseUID();
  try {
    const response = await fetch('/api/user/profile', {
      headers: { 'X-Firebase-UID': uid }
    });
    if (response.ok) {
      const result = await response.json();
      // Backend returns a flat profile dict (not wrapped in {profile: ...})
      // Guard: if accidentally wrapped, unwrap; otherwise return as-is
      return result.profile || (Object.keys(result).length > 0 ? result : null);
    }
  } catch (err) {
    console.warn('[apiLoadProfile] Fetch error:', err);
  }
  return null;
}

/**
 * Saves candidate job search preferences to Supabase REST API.
 * @param {Object} prefsData - Target titles, location, and workplace preferences.
 * @returns {Promise<boolean>} True if save succeeded.
 */
async function apiSavePreferences(prefsData) {
  const uid = getFirebaseUID();
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
      body: JSON.stringify(prefsData)
    });
    return response.ok;
  } catch (err) {
    console.warn('[apiSavePreferences] Save error:', err);
    return false;
  }
}

/**
 * Loads candidate job search preferences from Supabase REST API.
 * @returns {Promise<Object|null>} Preferences object or null.
 */
async function apiLoadPreferences() {
  const uid = getFirebaseUID();
  try {
    const response = await fetch('/api/user/preferences', {
      headers: { 'X-Firebase-UID': uid }
    });
    if (response.ok) {
      const result = await response.json();
      // Backend returns a flat preferences dict (not wrapped in {preferences: ...})
      return result.preferences || (Object.keys(result).length > 0 ? result : null);
    }
  } catch (err) {
    console.warn('[apiLoadPreferences] Fetch error:', err);
  }
  return null;
}

/**
 * Handles resume upload file selection from preferences/profile modals.
 * Parses PDF/Word binary, syncs profile state, and updates status UI.
 * @param {Event} event - File input change event.
 * @param {Function} [onComplete] - Optional completion callback.
 */
async function handleModalResumeUpload(event, onComplete) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('pref-resume-status');
  if (statusEl) statusEl.textContent = `⏳ Parsing ${file.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/match-resume', { method: 'POST', body: formData }).catch(err => {
      console.error('[ResumeUpload Network Error]', err);
      return null;
    });

    if (response && response.ok) {
      const data = await response.json();
      const parsedProf = data.candidate_profile || {};
      const existing = JSON.parse(localStorage.getItem('getarole_profile') || '{}');
      
      if (parsedProf.skills && parsedProf.skills.length > 0) {
        existing.skills = Array.from(new Set([...(existing.skills || []), ...parsedProf.skills]));
      }
      if (parsedProf.first_name) existing.first = parsedProf.first_name;
      if (parsedProf.last_name) existing.last = parsedProf.last_name;
      if (parsedProf.name && parsedProf.name !== 'Candidate') existing.name = parsedProf.name;
      if (parsedProf.headline) existing.headline = parsedProf.headline;
      if (parsedProf.email) existing.email = parsedProf.email;
      if (parsedProf.phone) existing.phone = parsedProf.phone;
      if (parsedProf.experience && parsedProf.experience.length > 0) existing.experience = parsedProf.experience;
      if (parsedProf.education && parsedProf.education.length > 0) existing.education = parsedProf.education;
      if (parsedProf.projects && parsedProf.projects.length > 0) existing.projects = parsedProf.projects;
      if (parsedProf.links) {
        existing.links = parsedProf.links;
        if (parsedProf.links.linkedin) existing.linkedin_url = parsedProf.links.linkedin;
        if (parsedProf.links.github) existing.github_url = parsedProf.links.github;
        if (parsedProf.links.portfolio) existing.portfolio_url = parsedProf.links.portfolio;
      }

      localStorage.setItem('getarole_profile', JSON.stringify(existing));
      localStorage.setItem('getarole_uploaded_resume', JSON.stringify({ filename: file.name, uploadedAt: new Date().toLocaleDateString(), raw_text: data.resume_text || '', skills: parsedProf.skills || [] }));
      
      if (data.resume_data) {
        const resumeV2 = data.resume_data;
        resumeV2.experience = parsedProf.experience || resumeV2.experience || [];
        resumeV2.education = parsedProf.education || resumeV2.education || [];
        resumeV2.projects = parsedProf.projects || resumeV2.projects || [];
        resumeV2.links = parsedProf.links || resumeV2.links || {};
        localStorage.setItem('getarole_resume_v2', JSON.stringify(resumeV2));
        
        const uid = getFirebaseUID();
        if (uid && uid !== 'guest_user') {
          fetch('/api/user/resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
            body: JSON.stringify({ resume: resumeV2 })
          }).catch(rErr => console.warn('[Resume Cloud Sync]', rErr));
        }
      }

      await apiSaveProfile(existing);

      const experienceCount = (parsedProf.experience || []).length;
      const educationCount = (parsedProf.education || []).length;
      if (statusEl) statusEl.textContent = `✓ ${file.name} parsed · ${(parsedProf.skills || []).length} skills, ${experienceCount} exp, ${educationCount} edu`;
      if (typeof toast === 'function') toast(`✅ Resume parsed! ${(parsedProf.skills || []).length} skills, ${experienceCount} experiences extracted.`);
      if (typeof onComplete === 'function') onComplete(parsedProf);
    } else {
      if (statusEl) statusEl.textContent = `⚠️ Error parsing ${file.name}`;
      if (typeof toast === 'function') toast(`❌ Resume upload failed. Please ensure file is a valid text PDF or Word document.`);
    }
  } catch (err) {
    console.error('handleModalResumeUpload Error:', err);
    if (statusEl) statusEl.textContent = `⚠️ ${file.name} upload error`;
    if (typeof toast === 'function') toast(`❌ Network error while uploading ${file.name}`);
  }
  event.target.value = '';
}

/**
 * WCAG 2.2 Compliant Focus Trap with Cleanup & Trigger Focus Return
 * @param {HTMLElement} modalEl - Active modal dialog element.
 * @param {Function} [onCloseCallback] - Optional close callback on Escape.
 * @returns {Function} Cleanup function to call when modal closes.
 */
function trapModalFocus(modalEl, onCloseCallback) {
  if (!modalEl) return () => {};
  const focusableSelectors = [
    'a[href]', 'button:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])',
    'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const getFocusable = () => Array.from(modalEl.querySelectorAll(focusableSelectors));
  const triggerElement = document.activeElement;

  // Make background inert
  const backgroundElements = Array.from(document.querySelectorAll('body > *:not([role="dialog"]):not([data-modal-container])'));
  backgroundElements.forEach(el => el.setAttribute('inert', ''));

  const handleKeydown = (e) => {
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      if (typeof onCloseCallback === 'function') {
        onCloseCallback();
      }
    }
  };

  modalEl.addEventListener('keydown', handleKeydown);
  const firstFocusable = getFocusable()[0];
  if (firstFocusable) firstFocusable.focus();

  return function cleanup() {
    modalEl.removeEventListener('keydown', handleKeydown);
    backgroundElements.forEach(el => el.removeAttribute('inert'));
    if (triggerElement && typeof triggerElement.focus === 'function') {
      triggerElement.focus();
    }
    // Dereference DOM nodes to prevent detached DOM memory leaks
    backgroundElements.length = 0;
  };
}

// Register Progressive Web App Service Worker (Idempotent)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http') && !window._pwaServiceWorkerRegistered) {
  window._pwaServiceWorkerRegistered = true;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (window.GETAROLE_DEBUG) {
          console.log('[getArole PWA] Service Worker registered with scope:', reg.scope);
        }
      })
      .catch((err) => {
        if (window.GETAROLE_DEBUG) {
          console.warn('[getArole PWA] Service Worker registration failed:', err);
        }
      });
  });
}

// Global Connection State Banner (Offline Detection with Memory-Safe Listener Registration)
function initConnectionMonitor() {
  if (window._connectionMonitorInitialized) return;
  window._connectionMonitorInitialized = true;

  let banner = document.getElementById('offline-indicator-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-indicator-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.style.cssText = 'display:none;position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:30px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:99999;border:1px solid #475569;align-items:center;gap:8px;';
    banner.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;"></span> You are currently browsing offline. Cached data is being shown.';
    document.body.appendChild(banner);
  }

  function updateStatus() {
    if (!navigator.onLine) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  window.addEventListener('offline', updateStatus);
  window.addEventListener('online', updateStatus);
  if (!navigator.onLine) updateStatus();
}

function initFooterYear() {
  const curYear = String(new Date().getFullYear());
  document.querySelectorAll('.global-footer-year').forEach(el => {
    el.textContent = curYear;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initConnectionMonitor();
    initFooterYear();
  });
} else {
  initConnectionMonitor();
  initFooterYear();
}

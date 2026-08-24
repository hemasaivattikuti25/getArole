/**
 * getArole Core Shared Frontend SDK (DRY Principle)
 * Handles Firebase UID detection, localStorage sync, API profile REST calls,
 * and resume upload modal handlers across static pages.
 */

function getFirebaseUID() {
  const sessionUID = sessionStorage.getItem('firebase_uid');
  if (sessionUID) return sessionUID;
  const localUID = localStorage.getItem('firebase_uid');
  if (localUID) return localUID;
  try {
    const userRaw = localStorage.getItem('getarole_user');
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (parsed && parsed.uid) return parsed.uid;
    }
  } catch(e) {}
  let userId = localStorage.getItem('getarole_user_id');
  if (!userId) {
    userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('getarole_user_id', userId);
  }
  return userId;
}

async function apiSaveProfile(profileData) {
  const uid = getFirebaseUID();
  try {
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
      body: JSON.stringify(profileData)
    });
    return res.ok;
  } catch(e) {
    console.warn('[apiSaveProfile]', e);
    return false;
  }
}

async function apiLoadProfile() {
  const uid = getFirebaseUID();
  try {
    const res = await fetch('/api/user/profile', {
      headers: { 'X-Firebase-UID': uid }
    });
    if (res.ok) {
      const data = await res.json();
      return data.profile || {};
    }
  } catch(e) {
    console.warn('[apiLoadProfile]', e);
  }
  return {};
}

async function apiSavePreferences(prefsData) {
  const uid = getFirebaseUID();
  try {
    const res = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
      body: JSON.stringify(prefsData)
    });
    return res.ok;
  } catch(e) {
    console.warn('[apiSavePreferences]', e);
    return false;
  }
}

async function apiLoadPreferences() {
  const uid = getFirebaseUID();
  try {
    const res = await fetch('/api/user/preferences', {
      headers: { 'X-Firebase-UID': uid }
    });
    if (res.ok) {
      const data = await res.json();
      return data.preferences || {};
    }
  } catch(e) {
    console.warn('[apiLoadPreferences]', e);
  }
  return {};
}

async function handleModalResumeUpload(e, onComplete) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('pref-resume-status');
  if (statusEl) statusEl.textContent = `⏳ Parsing ${file.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/match-resume', { method: 'POST', body: formData }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
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
        const rv2 = data.resume_data;
        rv2.experience = parsedProf.experience || rv2.experience || [];
        rv2.education = parsedProf.education || rv2.education || [];
        rv2.projects = parsedProf.projects || rv2.projects || [];
        rv2.links = parsedProf.links || rv2.links || {};
        localStorage.setItem('getarole_resume_v2', JSON.stringify(rv2));
      }

      await apiSaveProfile(existing);

      const expC = (parsedProf.experience || []).length;
      const eduC = (parsedProf.education || []).length;
      if (statusEl) statusEl.textContent = `✓ ${file.name} parsed · ${(parsedProf.skills || []).length} skills, ${expC} exp, ${eduC} edu`;
      if (typeof toast === 'function') toast(`✅ Resume parsed! ${(parsedProf.skills || []).length} skills, ${expC} experiences extracted.`);
      if (typeof onComplete === 'function') onComplete(parsedProf);
    } else {
      if (statusEl) statusEl.textContent = `✓ ${file.name} uploaded`;
      if (typeof toast === 'function') toast(`Resume ${file.name} uploaded!`);
    }
  } catch(err) {
    console.error('handleModalResumeUpload Error:', err);
    if (statusEl) statusEl.textContent = `✓ ${file.name} uploaded`;
  }
  e.target.value = '';
}

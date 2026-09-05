/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * getArole — Dual-Write Storage & Cloud Sync Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * Synchronously caches user preferences, profile, and resume to localStorage
 * (0ms instant UI rendering) and dual-writes directly to Supabase Cloud
 * PostgREST endpoints (using publishable anonymous key and Firebase UID).
 * 
 * Works reliably across static GitHub Pages, local FastAPI dev, and Next.js.
 */

(function () {
  'use strict';

  const SUPABASE_REST_URL = window.APP_CONFIG ? window.APP_CONFIG.SUPABASE_REST_URL : "https://tgmhtlqcjgcjedlnthfk.supabase.co/rest/v1";
  const SUPABASE_ANON_KEY = window.APP_CONFIG ? window.APP_CONFIG.SUPABASE_ANON_KEY : "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn";

  /**
   * Resolves the active user ID across Firebase Auth, localStorage, and sessionStorage.
   */
  function getEffectiveUID() {
    // 1. Check window.firebaseAuth current user
    try {
      if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseAuth.currentUser.uid) {
        return window.firebaseAuth.currentUser.uid;
      }
    } catch (_) {}

    // 2. Check storage keys
    const directUid = localStorage.getItem('firebase_uid') || sessionStorage.getItem('firebase_uid');
    if (directUid && directUid.trim()) return directUid.trim();

    // 3. Check getarole_user JSON
    try {
      const u = JSON.parse(localStorage.getItem('getarole_user') || '{}');
      if (u && u.uid && typeof u.uid === 'string') return u.uid;
    } catch (_) {}

    // 4. Check persistent client user ID
    let clientId = localStorage.getItem('getarole_user_id');
    if (!clientId) {
      clientId = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36).slice(-4);
      localStorage.setItem('getarole_user_id', clientId);
    }
    return clientId;
  }

  /**
   * Standardizes preferences object according to the canonical schema.
   */
  function canonicalizePreferences(rawPrefs) {
    const raw = rawPrefs || {};
    const roles = Array.isArray(raw.roles) && raw.roles.length > 0
      ? raw.roles
      : (Array.isArray(raw.specializations) && raw.specializations.length > 0
          ? raw.specializations
          : (raw.role ? [raw.role] : (raw.target_role ? [raw.target_role] : ['Software Engineer'])));

    const locations = Array.isArray(raw.locations) && raw.locations.length > 0
      ? raw.locations
      : (raw.city ? [raw.city] : ['Bengaluru', 'Remote in India']);

    const roletype = Array.isArray(raw.roletype) && raw.roletype.length > 0
      ? raw.roletype
      : (Array.isArray(raw.employmentTypes) && raw.employmentTypes.length > 0 ? raw.employmentTypes : ['Full-Time']);

    const compsize = Array.isArray(raw.compsize) && raw.compsize.length > 0
      ? raw.compsize
      : (Array.isArray(raw.companySizes) && raw.companySizes.length > 0 ? raw.companySizes : ['51-200', '200-1000']);

    const industries = Array.isArray(raw.industries) && raw.industries.length > 0
      ? raw.industries
      : (Array.isArray(raw.industries_inc) && raw.industries_inc.length > 0 ? raw.industries_inc : ['Fintech', 'SaaS', 'AI / Machine Learning']);

    const skills = Array.isArray(raw.skills_inc) && raw.skills_inc.length > 0
      ? raw.skills_inc
      : (Array.isArray(raw.skills) && raw.skills.length > 0 ? raw.skills : []);

    const workplaceType = raw.workplaceType || (locations.some(l => l.toLowerCase().includes('remote')) ? 'Remote' : 'Hybrid');

    return {
      role: roles[0] || 'Software Engineer',
      roles: roles,
      target_role: roles.join(', '),
      specializations: roles,
      city: locations[0] || 'Bengaluru',
      locations: locations,
      remoteOnly: workplaceType === 'Remote' || locations.some(l => l.toLowerCase().includes('remote')),
      workplaceType: workplaceType,
      rolelevel: Array.isArray(raw.rolelevel) && raw.rolelevel.length > 0 ? raw.rolelevel : ['Mid-Level (2-5 yrs)'],
      roletype: roletype,
      employmentTypes: roletype,
      compsize: compsize,
      companySizes: compsize,
      industries: industries,
      industries_inc: industries,
      skills_inc: skills,
      skills: skills,
      salary_amt: typeof raw.salary_amt === 'number' ? raw.salary_amt : (parseInt(raw.salary_amt) || 1200000),
      salary_curr: raw.salary_curr || 'INR',
      status: raw.status || 'Actively looking',
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Dual-writes User Preferences: LocalStorage (instant) + Supabase Cloud PostgREST
   */
  async function syncUserPreferences(rawPrefs) {
    const prefs = canonicalizePreferences(rawPrefs);
    const uid = getEffectiveUID();

    // 1. Direct Supabase PostgREST Cloud Upsert
    const supaPayload = {
      firebase_uid: uid,
      roles: prefs.roles,
      locations: prefs.locations,
      roletype: prefs.roletype,
      rolelevel: prefs.rolelevel,
      compsize: prefs.compsize,
      industries: prefs.industries,
      skills_inc: prefs.skills_inc,
      salary_amt: prefs.salary_amt,
      salary_curr: prefs.salary_curr,
      status: prefs.status
    };

    let supabaseSuccess = false;
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/user_preferences?on_conflict=firebase_uid`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(supaPayload)
      });
      if (res.ok) {
        supabaseSuccess = true;
      } else {
        console.warn('[Storage-Sync] Supabase prefs upsert HTTP', res.status);
      }
    } catch (err) {
      console.warn('[Storage-Sync] Supabase direct cloud error:', err);
    }

    // 2. Optional local FastAPI backend attempt (if running)
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
        body: JSON.stringify(prefs)
      });
    } catch (err) {}

    // 3. LocalStorage Write (Fallback & Cache update)
    try {
      localStorage.setItem('getarole_prefs', JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('getarole_prefs_updated', { detail: prefs }));
    } catch (e) {
      console.warn('[Storage-Sync] LocalStorage write error:', e);
    }

    return prefs;
  }

  /**
   * Loads user preferences: LocalStorage first, then re-hydrates from Supabase Cloud.
   */
  async function loadUserPreferences() {
    let localPrefs = {};
    try {
      localPrefs = JSON.parse(localStorage.getItem('getarole_prefs') || '{}');
    } catch (_) {}

    const uid = getEffectiveUID();
    if (!uid) return canonicalizePreferences(localPrefs);

    try {
      const res = await fetch(`${SUPABASE_REST_URL}/user_preferences?firebase_uid=eq.${encodeURIComponent(uid)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const cloud = rows[0];
          const merged = canonicalizePreferences({
            ...localPrefs,
            ...cloud,
            roles: cloud.roles || localPrefs.roles,
            locations: cloud.locations || localPrefs.locations,
            skills: cloud.skills_inc || localPrefs.skills,
            salary_amt: cloud.salary_amt || localPrefs.salary_amt,
            status: cloud.status || localPrefs.status
          });
          localStorage.setItem('getarole_prefs', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('[Storage-Sync] Supabase load error:', e);
    }

    return canonicalizePreferences(localPrefs);
  }

  /**
   * Dual-writes User Profile Dossier: LocalStorage + Supabase user_profiles & user_resumes
   */
  async function syncUserProfile(rawProfile) {
    const p = rawProfile || {};
    const uid = getEffectiveUID();

    let existingProfile = {};
    try {
      existingProfile = JSON.parse(localStorage.getItem('getarole_profile') || '{}');
      // Nuke legacy Hemasai Vattikuti mock profile from previous Next.js builds
      if (existingProfile.name === 'Hemasai Vattikuti' && existingProfile.email === 'hemasai@getarole.in') {
        existingProfile = {};
        localStorage.removeItem('getarole_profile');
      }
    } catch (_) {}

    // Standardize
    let firstName = p.first || p.first_name || '';
    let lastName = p.last || p.last_name || '';
    if (!firstName && p.name) {
      const parts = String(p.name).trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
    const fullName = p.name || `${firstName} ${lastName}`.trim() || existingProfile.name || 'Candidate';

    const canonicalProfile = {
      ...existingProfile,
      ...p,
      firebase_uid: uid,
      name: fullName,
      first: firstName,
      last: lastName,
      email: p.email || existingProfile.email || '',
      phone: p.phone || existingProfile.phone || '',
      loc: p.loc || p.location || p.city || existingProfile.loc || '',
      location: p.loc || p.location || p.city || existingProfile.location || '',
      headline: p.headline !== undefined ? p.headline : (existingProfile.headline || ''),
      notice: p.notice !== undefined ? p.notice : (existingProfile.notice || ''),
      summary: p.summary !== undefined ? p.summary : (p.bio !== undefined ? p.bio : (existingProfile.summary || '')),
      bio: p.summary !== undefined ? p.summary : (p.bio !== undefined ? p.bio : (existingProfile.bio || '')),
      skills: Array.isArray(p.skills) ? p.skills : (existingProfile.skills || []),
      skills_languages: Array.isArray(p.skills_languages) ? p.skills_languages : (existingProfile.skills_languages || []),
      skills_frameworks: Array.isArray(p.skills_frameworks) ? p.skills_frameworks : (existingProfile.skills_frameworks || []),
      skills_cloud: Array.isArray(p.skills_cloud) ? p.skills_cloud : (existingProfile.skills_cloud || []),
      skills_tools: Array.isArray(p.skills_tools) ? p.skills_tools : (existingProfile.skills_tools || []),
      experience: Array.isArray(p.experience) ? p.experience : (existingProfile.experience || []),
      projects: Array.isArray(p.projects) ? p.projects : (existingProfile.projects || []),
      education: Array.isArray(p.education) ? p.education : (existingProfile.education || []),
      certifications: Array.isArray(p.certifications) ? p.certifications : (existingProfile.certifications || []),
      achievements: Array.isArray(p.achievements) ? p.achievements : (Array.isArray(p.awards) ? p.awards : (existingProfile.achievements || existingProfile.awards || [])),
      awards: Array.isArray(p.awards) ? p.awards : (Array.isArray(p.achievements) ? p.achievements : (existingProfile.awards || existingProfile.achievements || [])),
      links: {
        ...(existingProfile.links || {}),
        ...(p.links || {}),
        linkedin: (p.links && p.links.linkedin) || p.linkedin_url || (existingProfile.links && existingProfile.links.linkedin) || '',
        github: (p.links && p.links.github) || p.github_url || (existingProfile.links && existingProfile.links.github) || '',
        portfolio: (p.links && p.links.portfolio) || p.portfolio_url || (existingProfile.links && existingProfile.links.portfolio) || '',
        leetcode: (p.links && p.links.leetcode) || (existingProfile.links && existingProfile.links.leetcode) || '',
        twitter: (p.links && p.links.twitter) || (existingProfile.links && existingProfile.links.twitter) || '',
        other: (p.links && p.links.other) || p.other_url || (existingProfile.links && existingProfile.links.other) || ''
      },
      updated_at: new Date().toISOString()
    };

    // 1. Direct Supabase PostgREST user_profiles Upsert
    const supaProfilePayload = {
      firebase_uid: uid,
      email: canonicalProfile.email,
      first: canonicalProfile.first,
      last: canonicalProfile.last,
      phone: canonicalProfile.phone,
      loc: canonicalProfile.loc,
      headline: canonicalProfile.headline,
      linkedin_url: (canonicalProfile.links && canonicalProfile.links.linkedin) || '',
      github_url: (canonicalProfile.links && canonicalProfile.links.github) || '',
      portfolio_url: (canonicalProfile.links && canonicalProfile.links.portfolio) || '',
      other_url: (canonicalProfile.links && canonicalProfile.links.other) || ''
    };

    let supabaseSuccess = false;
    try {
      const resp = await fetch(`${SUPABASE_REST_URL}/user_profiles?on_conflict=firebase_uid`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(supaProfilePayload)
      });
      if (resp.ok) {
        supabaseSuccess = true;
      } else {
        console.warn('[Storage-Sync] Supabase profile upsert failed:', await resp.text());
      }
    } catch (err) {
      console.warn('[Storage-Sync] Supabase profile upsert error:', err);
    }

    // 2. Optional local FastAPI backend attempt
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
        body: JSON.stringify(canonicalProfile)
      });
    } catch (err) {}

    // 3. LocalStorage Write (Fallback & Cache update)
    try {
      localStorage.setItem('getarole_profile', JSON.stringify(canonicalProfile));
      window.dispatchEvent(new CustomEvent('getarole_profile_updated', { detail: canonicalProfile }));
    } catch (e) {
      console.warn('[Storage-Sync] LocalStorage profile write error:', e);
    }

    return canonicalProfile;
  }

  /**
   * Loads user profile: LocalStorage first, then hydrates from Supabase Cloud.
   */
  async function loadUserProfile() {
    let localProfile = {};
    try {
      localProfile = JSON.parse(localStorage.getItem('getarole_profile') || '{}');
    } catch (_) {}

    const uid = getEffectiveUID();
    if (!uid) return localProfile;

    try {
      const res = await fetch(`${SUPABASE_REST_URL}/user_profiles?firebase_uid=eq.${encodeURIComponent(uid)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const cloud = rows[0];
          const merged = {
            ...localProfile,
            ...cloud,
            name: localProfile.name || `${cloud.first || ''} ${cloud.last || ''}`.trim() || 'Candidate',
            headline: cloud.headline || localProfile.headline || '',
            email: cloud.email || localProfile.email || '',
            phone: cloud.phone || localProfile.phone || '',
            loc: cloud.loc || localProfile.loc || '',
            notice: localProfile.notice || '',
            skills_languages: localProfile.skills_languages || [],
            skills_frameworks: localProfile.skills_frameworks || [],
            skills_cloud: localProfile.skills_cloud || [],
            skills_tools: localProfile.skills_tools || [],
            achievements: localProfile.achievements || localProfile.awards || [],
            links: {
              ...(localProfile.links || {}),
              linkedin: cloud.linkedin_url || (localProfile.links && localProfile.links.linkedin) || '',
              github: cloud.github_url || (localProfile.links && localProfile.links.github) || '',
              portfolio: cloud.portfolio_url || (localProfile.links && localProfile.links.portfolio) || ''
            }
          };
          localStorage.setItem('getarole_profile', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('[Storage-Sync] Supabase load profile error:', e);
    }

    return localProfile;
  }

  /**
   * Dual-writes User Resume: LocalStorage (instant) + Supabase Cloud user_resumes
   */
  async function syncUserResume(rawResume) {
    if (!rawResume) return null;
    const R = typeof rawResume === 'string' ? JSON.parse(rawResume) : rawResume;
    const uid = getEffectiveUID();

    // 2. Format skills array for Supabase schema
    let skillList = [];
    if (Array.isArray(R.skills)) {
      R.skills.forEach(sg => {
        if (typeof sg === 'string') {
          skillList.push(sg.trim());
        } else if (sg && sg.items) {
          String(sg.items).split(/[,;\n]+/).forEach(s => {
            const trimmed = s.trim();
            if (trimmed) skillList.push(trimmed);
          });
        }
      });
    }

    const supaPayload = {
      firebase_uid: uid,
      work_experience: Array.isArray(R.experience) ? R.experience : [],
      education: Array.isArray(R.education) ? R.education : [],
      projects: Array.isArray(R.projects) ? R.projects : [],
      skills: skillList,
      raw_text: JSON.stringify(R),
      filename: R.filename || 'getarole_resume.json',
      updated_at: new Date().toISOString()
    };

    // 1. Supabase Cloud PostgREST Upsert (Resilient PATCH-then-POST strategy)
    let supabaseSuccess = false;
    try {
      const patchRes = await fetch(`${SUPABASE_REST_URL}/user_resumes?firebase_uid=eq.${encodeURIComponent(uid)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(supaPayload)
      });
      const updatedRows = patchRes.ok ? await patchRes.json() : [];
      if (!updatedRows || updatedRows.length === 0) {
        // No row existed yet for this user; insert cleanly
        const postRes = await fetch(`${SUPABASE_REST_URL}/user_resumes`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(supaPayload)
        });
        if (postRes.ok) supabaseSuccess = true;
      } else {
        supabaseSuccess = true;
      }
    } catch (err) {
      console.warn('[Storage-Sync] Supabase resume upsert error:', err);
    }

    // 2. Optional local FastAPI backend attempt
    try {
      await fetch('/api/user/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-UID': uid },
        body: JSON.stringify({ resume: R })
      });
    } catch (err) {}

    // 3. LocalStorage Write (Fallback & Cache update)
    try {
      localStorage.setItem('getarole_resume_v2', JSON.stringify(R));
      window.dispatchEvent(new CustomEvent('getarole_resume_updated', { detail: R }));
    } catch (e) {
      console.warn('[Storage-Sync] LocalStorage resume write error:', e);
    }

    return R;
  }

  /**
   * Loads user resume: LocalStorage first, then re-hydrates from Supabase Cloud.
   */
  async function loadUserResume() {
    let localResume = null;
    try {
      const raw = localStorage.getItem('getarole_resume_v2');
      if (raw) localResume = JSON.parse(raw);
    } catch (_) {}

    const uid = getEffectiveUID();
    if (!uid) return localResume;

    try {
      const res = await fetch(`${SUPABASE_REST_URL}/user_resumes?firebase_uid=eq.${encodeURIComponent(uid)}&order=updated_at.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const cloud = rows[0];
          let restored = null;
          if (cloud.raw_text) {
            try { restored = JSON.parse(cloud.raw_text); } catch (_) {}
          }
          if (!restored) {
            restored = {
              header: {},
              experience: cloud.work_experience || [],
              education: cloud.education || [],
              projects: cloud.projects || [],
              skills: Array.isArray(cloud.skills) && cloud.skills.length > 0 ? [{ label: 'Skills & Competencies', items: cloud.skills.join(', ') }] : []
            };
          }
          if (restored) {
            const merged = { ...(localResume || {}), ...restored };
            localStorage.setItem('getarole_resume_v2', JSON.stringify(merged));
            return merged;
          }
        }
      }
    } catch (e) {
      console.warn('[Storage-Sync] Supabase load resume error:', e);
    }

    return localResume;
  }

  /**
   * Safe Sign-Out: Purges authentication tokens and session identifiers.
   * If purgeAll is true, completely clears candidate data from the device as well.
   */
  async function safeSignOut(purgeAll = false) {
    try {
      if (window.firebaseAuth && typeof window.firebaseAuth.signOut === 'function') {
        await window.firebaseAuth.signOut();
      }
    } catch (_) {}
    try {
      const mod = await import('/firebase-auth.js');
      if (mod && typeof mod.logoutUser === 'function') {
        await mod.logoutUser(purgeAll);
      }
    } catch (_) {}
    localStorage.removeItem('getarole_user');
    localStorage.removeItem('firebase_uid');
    localStorage.removeItem('getarole_username');
    sessionStorage.removeItem('firebase_uid');
    sessionStorage.clear();
    if (purgeAll) {
      localStorage.removeItem('getarole_profile');
      localStorage.removeItem('getarole_prefs');
      localStorage.removeItem('getarole_resume_v2');
      localStorage.removeItem('getarole_resume_pdf');
      localStorage.removeItem('getarole_tracker');
    }
    window.location.href = '/';
  }

  /**
   * Permanent Account Deletion:
   * Cascades through backend GDPR deletion endpoint, deletes Firebase user,
   * wipes 100% of client storage, and redirects to home.
   */
  async function deleteUserAccount() {
    try {
      // 1. Delete from Supabase via our backend API
      const uid = getEffectiveUID();
      if (uid) {
        await fetch('/api/user/account', {
          method: 'DELETE',
          headers: { 'X-Firebase-UID': uid }
        }).catch(err => console.error('[Supabase Delete Error]', err));
      }

      // 2. Delete from Firebase
      const mod = await import('/firebase-auth.js');
      if (mod && typeof mod.deleteAccount === 'function') {
        await mod.deleteAccount();
      }
    } catch (e) {
      console.error('[Delete Account Error]', e);
      throw e; // Bubble up to UI
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }

  window.safeSignOut = safeSignOut;
  window.handleLogout = safeSignOut;
  window.deleteUserAccount = deleteUserAccount;

  // Export globally
  window.getAroleSync = {
    getEffectiveUID,
    canonicalizePreferences,
    syncUserPreferences,
    loadUserPreferences,
    syncUserProfile,
    deleteUserAccount,
    loadUserProfile,
    syncUserResume,
    loadUserResume,
    safeSignOut,
    SUPABASE_REST_URL,
    SUPABASE_ANON_KEY
  };

})();



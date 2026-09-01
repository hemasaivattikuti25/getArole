(function () {
  'use strict';

  // 1. Inject Comprehensive Mobile CSS immediately
  const css = `
    @media (max-width: 768px) {
      /* Hide desktop navigation tabs & desktop profile button */
      header .nav-tabs,
      .nav-tabs,
      .header-actions .user-profile-btn,
      .header-actions .btn-refresh {
        display: none !important;
      }

      /* Clean Header for Mobile */
      header {
        position: sticky !important;
        top: 0 !important;
        z-index: 999 !important;
        height: 56px !important;
        background: #ffffff !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }

      .header-inner {
        padding: 0 16px !important;
        height: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        max-width: 100% !important;
      }

      .brand-group {
        gap: 8px !important;
      }

      .brand-title {
        font-size: 18px !important;
      }

      body {
        padding-bottom: 74px !important;
      }

      /* Mobile Hamburger Icon in Header */
      .mobile-hamburger-btn {
        display: flex !important;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #334155;
        padding: 8px;
        margin-right: -8px;
        border-radius: 8px;
      }

      .mobile-hamburger-btn:active {
        background: #f1f5f9;
      }

      /* Fixed Bottom Navigation Bar */
      .mobile-bottom-nav {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 62px !important;
        background: #ffffff !important;
        border-top: 1px solid #e2e8f0 !important;
        display: flex !important;
        justify-content: space-around !important;
        align-items: center !important;
        padding: 4px 8px !important;
        padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px)) !important;
        z-index: 9990 !important;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05) !important;
      }

      .mobile-bottom-nav-link {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
        flex: 1 !important;
        text-decoration: none !important;
        color: #64748b !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif !important;
        position: relative !important;
        padding: 6px 0 !important;
        transition: color 0.15s ease !important;
      }

      .mobile-bottom-nav-link svg {
        width: 22px !important;
        height: 22px !important;
        stroke: currentColor !important;
        stroke-width: 2 !important;
        fill: none !important;
        transition: stroke 0.15s ease !important;
      }

      .mobile-bottom-nav-link.active {
        color: #008DA5 !important;
        font-weight: 700 !important;
      }

      .mobile-bottom-nav-link.active svg {
        stroke: #008DA5 !important;
      }

      .mobile-bottom-nav-link.active::after {
        content: '' !important;
        position: absolute !important;
        top: -4px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 32px !important;
        height: 3px !important;
        background-color: #00A9E0 !important;
        border-radius: 0 0 4px 4px !important;
      }

      /* Slide-out Sidebar Drawer */
      .mobile-nav-backdrop {
        position: fixed !important;
        inset: 0 !important;
        background-color: rgba(15, 23, 42, 0.5) !important;
        backdrop-filter: blur(2px) !important;
        z-index: 9998 !important;
        opacity: 0 !important;
        visibility: hidden !important;
        transition: opacity 0.25s ease, visibility 0.25s ease !important;
      }

      .mobile-nav-backdrop.open {
        opacity: 1 !important;
        visibility: visible !important;
      }

      .mobile-nav-drawer {
        position: fixed !important;
        top: 0 !important;
        left: -300px !important;
        bottom: 0 !important;
        width: 280px !important;
        max-width: 80vw !important;
        background-color: #ffffff !important;
        z-index: 9999 !important;
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15) !important;
        display: flex !important;
        flex-direction: column !important;
        transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        overflow-y: auto !important;
      }

      .mobile-nav-drawer.open {
        left: 0 !important;
      }

      .mobile-nav-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 16px 20px !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }

      .mobile-nav-brand {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        text-decoration: none !important;
      }

      .mobile-nav-brand img {
        width: 26px !important;
        height: 26px !important;
      }

      .mobile-nav-close-btn {
        background: transparent !important;
        border: none !important;
        color: #475569 !important;
        cursor: pointer !important;
        padding: 6px !important;
        border-radius: 6px !important;
      }

      .mobile-nav-list {
        display: flex !important;
        flex-direction: column !important;
        padding: 12px 0 !important;
        margin: 0 !important;
        list-style: none !important;
      }

      .mobile-nav-link {
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        padding: 12px 20px !important;
        color: #334155 !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        text-decoration: none !important;
      }

      .mobile-nav-link:active {
        background-color: #f8fafc !important;
      }

      .mobile-nav-link svg {
        width: 20px !important;
        height: 20px !important;
        stroke: #64748b !important;
        stroke-width: 2 !important;
        fill: none !important;
      }

      .mobile-nav-link.active {
        background-color: #e0f7fa !important;
        color: #008da5 !important;
        border-left: 4px solid #00a9e0 !important;
      }

      .mobile-nav-link.active svg {
        stroke: #008da5 !important;
      }

      /* ══════════════════════════════════════════════════════════════════
         JOB DESCRIPTION (JD) MOBILE OVERLAY SYSTEM
         ══════════════════════════════════════════════════════════════════ */
      .jobs-split-container {
        display: block !important;
        width: 100% !important;
        position: relative !important;
      }

      .jobs-feed-col {
        display: block !important;
        width: 100% !important;
      }

      /* Hide detail col by default on mobile */
      .job-detail-col {
        display: none !important;
      }

      /* When body has .mobile-jd-open, hide the feed and show the JD */
      body.mobile-jd-open .jobs-feed-col {
        display: none !important;
      }

      body.mobile-jd-open .job-detail-col {
        display: block !important;
        width: 100% !important;
        min-height: calc(100vh - 120px) !important;
        background: #ffffff !important;
      }

      /* Sleek Filter Bar on Mobile */
      .filter-bar {
        padding: 10px 12px !important;
        background: #ffffff !important;
        border-bottom: 1px solid #e2e8f0 !important;
        position: sticky !important;
        top: 56px !important;
        z-index: 90 !important;
      }

      .filter-top-row {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 8px !important;
      }

      .search-input-wrap {
        flex: 1 !important;
        min-width: 0 !important;
      }

      .search-input {
        height: 38px !important;
        font-size: 14px !important;
        padding-left: 36px !important;
        border-radius: 10px !important;
        border: 1.5px solid #cbd5e1 !important;
      }

      /* Single-row horizontal scrollable filter pills */
      .filter-bottom-row {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
        gap: 8px !important;
        padding: 2px 0 6px !important;
      }
      .filter-bottom-row::-webkit-scrollbar { display: none !important; }

      .filter-dropdown,
      .btn-filter-pill {
        flex-shrink: 0 !important;
        width: auto !important;
        min-width: max-content !important;
        height: 34px !important;
        padding: 4px 12px !important;
        border-radius: 20px !important;
        font-size: 12.5px !important;
        font-weight: 600 !important;
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        color: #334155 !important;
        cursor: pointer !important;
        white-space: nowrap !important;
      }

      .filter-dropdown:focus,
      .btn-filter-pill.active {
        background: #e0f7fa !important;
        border-color: #00A9E0 !important;
        color: #008DA5 !important;
        font-weight: 700 !important;
      }

      /* Floating/Sticky Back to Jobs button */
      .mobile-jd-back-btn {
        display: none;
      }

      body.mobile-jd-open .mobile-jd-back-btn {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        width: calc(100% - 32px) !important;
        margin: 12px 16px !important;
        padding: 10px 16px !important;
        background: #f8fafc !important;
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 12px !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #0f172a !important;
        cursor: pointer !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04) !important;
      }

      body.mobile-jd-open .mobile-jd-back-btn:active {
        background: #e2e8f0 !important;
      }
    }

    @media (min-width: 769px) {
      .mobile-bottom-nav,
      .mobile-hamburger-btn,
      .mobile-nav-drawer,
      .mobile-nav-backdrop,
      .mobile-jd-back-btn {
        display: none !important;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'getarole-mobile-nav-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // 2. Setup Navigation DOM elements
  function initMobileUI() {
    // A. Hamburger Button in Header
    const headerActions = document.querySelector('.header-actions');
    const headerInner = document.querySelector('.header-inner');
    const targetHeader = headerActions || headerInner;

    if (targetHeader && !document.querySelector('.mobile-hamburger-btn')) {
      const hamburger = document.createElement('button');
      hamburger.className = 'mobile-hamburger-btn';
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      hamburger.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      targetHeader.appendChild(hamburger);
      hamburger.addEventListener('click', toggleDrawer);
    }

    // B. Bottom Navigation Bar
    const path = window.location.pathname;
    const isHome = path === '/' || path === '/dashboard' || path.startsWith('/dashboard');
    const isMatches = path.startsWith('/matches');
    const isExplore = path.startsWith('/explore');
    const isProfile = path.startsWith('/profile') || path.startsWith('/preferences');

    if (!document.querySelector('.mobile-bottom-nav')) {
      const nav = document.createElement('nav');
      nav.className = 'mobile-bottom-nav';
      nav.innerHTML = `
        <a href="/dashboard" class="mobile-bottom-nav-link ${isHome ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </a>
        <a href="/matches" class="mobile-bottom-nav-link ${isMatches ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>Matches</span>
        </a>
        <a href="/explore" class="mobile-bottom-nav-link ${isExplore ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          <span>Jobs</span>
        </a>
        <a href="/profile" class="mobile-bottom-nav-link ${isProfile ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Profile</span>
        </a>
      `;
      document.body.appendChild(nav);
    }

    // C. Slide-out Drawer Menu
    if (!document.querySelector('.mobile-nav-drawer')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      backdrop.addEventListener('click', toggleDrawer);

      const drawer = document.createElement('aside');
      drawer.className = 'mobile-nav-drawer';
      drawer.innerHTML = `
        <div class="mobile-nav-header">
          <a href="/dashboard" class="mobile-nav-brand">
            <img src="/logo.svg" onerror="this.src='/favicon.png'" alt="getArole">
            <span style="font-family:'Outfit', sans-serif; font-size:19px; font-weight:800; color:#0f172a;">get<span style="color:#4f46e5;">A</span>role</span>
          </a>
          <button class="mobile-nav-close-btn" aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <nav class="mobile-nav-list">
          <div style="padding: 10px 20px 4px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">AI Career Tools</div>
          <a href="/resume-builder" class="mobile-nav-link ${path.startsWith('/resume-builder') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            ATS Resume Builder
          </a>
          <a href="/cover-letter-builder" class="mobile-nav-link ${path.startsWith('/cover-letter-builder') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Cover Letter Generator
          </a>
          <div style="height: 1px; background: #e2e8f0; margin: 8px 0;"></div>
          <div style="padding: 10px 20px 4px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Account</div>
          <a href="/profile" class="mobile-nav-link ${path === '/profile' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Candidate Profile
          </a>
          <a href="/preferences" class="mobile-nav-link ${path === '/preferences' ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Job Preferences
          </a>
        </nav>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);
      drawer.querySelector('.mobile-nav-close-btn').addEventListener('click', toggleDrawer);
    }

    // D. Setup Mobile Back Button for JD Pane
    let backBtn = document.querySelector('.mobile-jd-back-btn');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.className = 'mobile-jd-back-btn';
      backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> ← Back to Job List';
      
      const detailPane = document.getElementById('job-detail-pane') || document.getElementById('matches-detail-pane') || document.querySelector('.job-detail-col');
      if (detailPane && detailPane.parentNode) {
        detailPane.parentNode.insertBefore(backBtn, detailPane);
      } else {
        document.body.appendChild(backBtn);
      }

      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove('mobile-jd-open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function toggleDrawer() {
    const drawer = document.querySelector('.mobile-nav-drawer');
    const backdrop = document.querySelector('.mobile-nav-backdrop');
    if (drawer) drawer.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
    document.body.style.overflow = (drawer && drawer.classList.contains('open')) ? 'hidden' : '';
  }

  // 3. CAPTURE-PHASE Event Listener for 100% Reliable Job Card Clicks on Mobile
  document.addEventListener('click', function (e) {
    if (window.innerWidth > 768) return;

    // Check if the clicked element is inside a job card
    const card = e.target.closest('.job-card') || 
                 e.target.closest('[onclick*="selectJob"]') || 
                 e.target.closest('[onclick*="selectMatchJob"]');

    if (card) {
      // Open JD mobile view
      document.body.classList.add('mobile-jd-open');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, true); // TRUE = CAPTURE PHASE! Runs before DOM changes

  // Force Service Worker to update and discard stale caches
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.update();
      }
    }).catch(function(e) {});
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileUI);
  } else {
    initMobileUI();
  }
})();

(function initMobileNav() {
  if (document.getElementById('mobile-nav-style')) return; // Already initialized

  // 1. Inject Styles
  const style = document.createElement('style');
  style.id = 'mobile-nav-style';
  style.innerHTML = `
    @media (max-width: 768px) {
      /* Clean up existing header */
      .nav-tabs { display: none !important; }
      .user-profile-btn { display: none !important; } 
      
      .header-inner {
        padding: 12px 16px !important;
        justify-content: space-between !important;
      }
      
      body {
        padding-bottom: 70px !important;
      }
      
      .mobile-hamburger {
        display: flex !important;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        color: #475569;
        padding: 8px;
        margin-left: 8px;
        border-radius: 6px;
      }
      
      /* Bottom Navigation Bar */
      .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: #ffffff;
        border-top: 1px solid #eaecf0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
        z-index: 9990;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.03);
      }
      
      .mobile-bottom-nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        flex: 1;
        text-decoration: none;
        color: #64748b;
        font-size: 11px;
        font-weight: 500;
        font-family: 'Outfit', -apple-system, sans-serif;
        position: relative;
        padding: 6px 0;
        transition: color 0.2s;
      }
      
      .mobile-bottom-nav-link svg {
        width: 24px;
        height: 24px;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
        transition: all 0.2s;
      }
      
      .mobile-bottom-nav-link.active {
        color: #00A9E0; 
        font-weight: 600;
      }
      .mobile-bottom-nav-link.active svg {
        stroke: #00A9E0;
      }
      
      .mobile-bottom-nav-link.active::after {
        content: '';
        position: absolute;
        bottom: -8px; 
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 3px;
        background-color: #00A9E0;
        border-radius: 4px 4px 0 0;
      }

      /* Slide-out Sidebar Panel (for other tools) */
      .mobile-nav-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(2px);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      .mobile-nav-backdrop.open {
        opacity: 1;
        visibility: visible;
      }

      .mobile-nav-drawer {
        position: fixed;
        top: 0;
        left: -320px;
        bottom: 0;
        width: 280px;
        max-width: 80vw;
        background-color: #ffffff;
        z-index: 9999;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        overflow-y: auto;
      }
      .mobile-nav-drawer.open {
        left: 0;
      }

      .mobile-nav-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #EAECF0;
      }
      
      .mobile-nav-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
      }
      .mobile-nav-brand img {
        width: 28px;
        height: 28px;
      }
      .brand-name {
        font-family: 'Outfit', sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: #101828;
      }
      .brand-name span { color: var(--primary, #4f46e5); }

      .mobile-nav-close-btn {
        background: transparent;
        border: none;
        color: #475569;
        cursor: pointer;
        padding: 6px;
      }
      
      .mobile-nav-list {
        display: flex;
        flex-direction: column;
        padding: 12px 0;
        margin: 0;
        list-style: none;
      }

      .mobile-nav-link {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 24px;
        color: #344054;
        font-size: 16px;
        font-weight: 500;
        text-decoration: none;
      }

      .mobile-nav-link svg {
        width: 22px;
        height: 22px;
        stroke: #475569;
        stroke-width: 2;
        fill: none;
      }
      
      .mobile-nav-link.active {
        background-color: #E0F7FA;
        color: #008DA5;
        font-weight: 600;
        border-left: 4px solid #00A9E0;
      }
      .mobile-nav-link.active svg { stroke: #008DA5; }

      /* JDs Mobile View Overrides */
      .mobile-jd-back-btn {
        display: none;
      }
      
      body.mobile-jd-open .mobile-jd-back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        position: fixed;
        top: 72px; /* Just below header */
        left: 16px;
        z-index: 9980;
        background: #ffffff;
        border: 1px solid #eaecf0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 8px 16px;
        border-radius: 24px;
        font-weight: 700;
        font-size: 13px;
        color: #0f172a;
        cursor: pointer;
      }

      body.mobile-jd-open .jobs-feed-col {
        display: none !important;
      }
      body.mobile-jd-open .job-detail-col {
        display: block !important;
        width: 100% !important;
        padding-top: 60px !important;
      }
      body.mobile-jd-open .mobile-bottom-nav {
        display: none !important; 
      }
    }
    
    @media (min-width: 769px) {
      .mobile-hamburger, .mobile-nav-drawer, .mobile-nav-backdrop, .mobile-bottom-nav, .mobile-jd-back-btn {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  function setupNav() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.querySelector('.mobile-hamburger')) {
      const hamburger = document.createElement('button');
      hamburger.className = 'mobile-hamburger';
      hamburger.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      headerActions.appendChild(hamburger);
      hamburger.addEventListener('click', toggleMobileNav);
    }

    const currentPath = window.location.pathname;
    const isActive = (path) => currentPath.startsWith(path) ? 'active' : '';

    if (!document.querySelector('.mobile-bottom-nav')) {
      const bottomNav = document.createElement('nav');
      bottomNav.className = 'mobile-bottom-nav';
      bottomNav.innerHTML = `
        <a href="/dashboard" class="mobile-bottom-nav-link ${isActive('/dashboard')}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Home
        </a>
        <a href="/matches" class="mobile-bottom-nav-link \${isActive('/matches')}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          Matches
        </a>
        <a href="/explore" class="mobile-bottom-nav-link ${isActive('/explore')}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          Jobs
        </a>
        <a href="/profile" class="mobile-bottom-nav-link ${isActive('/profile') || isActive('/preferences') ? 'active' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Profile
        </a>
      `;
      document.body.appendChild(bottomNav);
    }

    if (!document.querySelector('.mobile-nav-drawer')) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-nav-backdrop';
      overlay.addEventListener('click', toggleMobileNav);
      
      const sidebar = document.createElement('aside');
      sidebar.className = 'mobile-nav-drawer';
      
      sidebar.innerHTML = `
        <div class="mobile-nav-header">
          <a href="/dashboard" class="mobile-nav-brand">
            <img src="/static/logo.svg" onerror="this.src='/logo.svg'" alt="getArole">
            <span class="brand-name">get<span>A</span>role</span>
          </a>
          <button class="mobile-nav-close-btn" aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <nav class="mobile-nav-list">
          <div style="padding: 12px 24px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Tools</div>
          <a href="/resume-builder" class="mobile-nav-link ${isActive('/resume-builder')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            ATS Resume
          </a>
          <a href="/cover-letter-builder" class="mobile-nav-link ${isActive('/cover-letter-builder')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Cover Letter
          </a>
          <div style="height: 1px; background: #EAECF0; margin: 12px 0;"></div>
          <a href="/profile" class="mobile-nav-link ${isActive('/profile') || isActive('/preferences') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Settings
          </a>
        </nav>
      `;
      
      document.body.appendChild(overlay);
      document.body.appendChild(sidebar);
      
      sidebar.querySelector('.mobile-nav-close-btn').addEventListener('click', toggleMobileNav);
    }
    
    // Setup JD Mobile Flow
    if (!document.querySelector('.mobile-jd-back-btn')) {
      const backBtn = document.createElement('button');
      backBtn.className = 'mobile-jd-back-btn';
      backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg> Back to Jobs';
      document.body.appendChild(backBtn);
      
      backBtn.addEventListener('click', () => {
        document.body.classList.remove('mobile-jd-open');
      });
      
      // Patch the selectJob functions directly since DOM rewriting breaks event bubbling
      setTimeout(() => {
        const _origSelectJob = window.selectJob;
        if (typeof _origSelectJob === 'function') {
          window.selectJob = function() {
            _origSelectJob.apply(this, arguments);
            if (window.innerWidth <= 768) {
              document.body.classList.add('mobile-jd-open');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          };
        }
        
        const _origSelectMatchJob = window.selectMatchJob;
        if (typeof _origSelectMatchJob === 'function') {
          window.selectMatchJob = function() {
            _origSelectMatchJob.apply(this, arguments);
            if (window.innerWidth <= 768) {
              document.body.classList.add('mobile-jd-open');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          };
        }
      }, 500); // Wait for inline scripts to define functions
    }
  }

  function toggleMobileNav() {
    const sidebar = document.querySelector('.mobile-nav-drawer');
    const overlay = document.querySelector('.mobile-nav-backdrop');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    
    if (sidebar && sidebar.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNav);
  } else {
    setupNav();
  }
})();

(function initMobileNav() {
  if (document.getElementById('mobile-nav-style')) return; // Already initialized

  // 1. Inject Styles
  const style = document.createElement('style');
  style.id = 'mobile-nav-style';
  style.innerHTML = `
    @media (max-width: 768px) {
      .nav-tabs { 
        display: none !important; 
      }
      .mobile-hamburger {
        display: flex !important;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-muted, #475569);
        padding: 8px;
        margin-left: 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }
      .mobile-hamburger:hover {
        background: var(--bg-subtle, #f8fafc);
      }
      
      /* Dark Backdrop Overlay */
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

      /* Slide-out Sidebar Panel */
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

      /* Header Inside Drawer */
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
      .brand-name span {
        color: var(--primary, #4f46e5);
      }

      .mobile-nav-close-btn {
        background: transparent;
        border: none;
        color: #475569;
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .mobile-nav-close-btn:hover {
        background-color: #f1f5f9;
      }

      /* Navigation Items List */
      .mobile-nav-list {
        display: flex;
        flex-direction: column;
        padding: 12px 0;
        margin: 0;
        list-style: none;
      }

      /* Default / Inactive Nav Item */
      .mobile-nav-link {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 24px;
        color: #344054;
        font-size: 16px;
        font-weight: 500;
        text-decoration: none;
        position: relative;
        transition: all 0.2s ease;
        border-left: 4px solid transparent;
      }

      .mobile-nav-link:hover {
        background-color: #F8FAFC;
        color: #0F172A;
      }

      .mobile-nav-link svg {
        width: 22px;
        height: 22px;
        stroke: #475569;
        stroke-width: 2;
        fill: none;
        transition: stroke 0.2s;
      }

      .mobile-nav-link:hover svg {
        stroke: #0F172A;
      }

      /* Active Nav Item */
      .mobile-nav-link.active {
        background-color: #E0F7FA; /* Light ice blue */
        color: #008DA5; /* Cyan / Teal */
        font-weight: 600;
        border-left: 4px solid #00A9E0; /* Left indicator bar */
      }

      .mobile-nav-link.active svg {
        stroke: #008DA5;
      }
    }
    
    @media (min-width: 769px) {
      .mobile-hamburger, .mobile-nav-drawer, .mobile-nav-backdrop {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Wait for DOM to load if it hasn't
  function setupNav() {
    // Add Hamburger to Header
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return; // Not a standard page

    if (!document.querySelector('.mobile-hamburger')) {
      const hamburger = document.createElement('button');
      hamburger.className = 'mobile-hamburger';
      hamburger.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      
      headerActions.appendChild(hamburger);
      hamburger.addEventListener('click', toggleMobileNav);
    }

    // Build Sidebar and Overlay
    if (!document.querySelector('.mobile-nav-drawer')) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-nav-backdrop';
      overlay.addEventListener('click', toggleMobileNav);
      
      const sidebar = document.createElement('aside');
      sidebar.className = 'mobile-nav-drawer';
      
      // Get current path to set active state
      const currentPath = window.location.pathname;
      const isActive = (path) => currentPath.startsWith(path) ? 'active' : '';

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
          <a href="/dashboard" class="mobile-nav-link ${isActive('/dashboard')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Overview
          </a>
          <a href="/matches" class="mobile-nav-link ${isActive('/matches')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Matches
          </a>
          <a href="/explore" class="mobile-nav-link ${isActive('/explore')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Explore Jobs
          </a>
          <a href="/resume-builder" class="mobile-nav-link ${isActive('/resume-builder')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            ATS Resume
          </a>
          <a href="/cover-letter-builder" class="mobile-nav-link ${isActive('/cover-letter-builder')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Cover Letter
          </a>
          <a href="/profile" class="mobile-nav-link ${isActive('/profile') || isActive('/preferences') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Profile
          </a>
        </nav>
      `;
      
      document.body.appendChild(overlay);
      document.body.appendChild(sidebar);
      
      sidebar.querySelector('.mobile-nav-close-btn').addEventListener('click', toggleMobileNav);
    }
  }

  function toggleMobileNav() {
    const sidebar = document.querySelector('.mobile-nav-drawer');
    const overlay = document.querySelector('.mobile-nav-backdrop');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    
    // Prevent background scrolling when open
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

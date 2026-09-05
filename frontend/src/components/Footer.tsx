"use client";

import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
<footer className="global-footer" style={{ 'background': '#ffffff', 'borderTop': '1px solid #e2e8f0', 'padding': '48px 24px 24px', 'marginTop': 'auto', 'fontFamily': '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif', 'position': 'relative' }}>
    <style>
      .global-footer a.footer-nav-link { color: #64748b; text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.15s ease, transform 0.15s ease; display: inline-block; }
      .global-footer a.footer-nav-link:hover { color: #4f46e5 !important; transform: translateX(2px); }
      .footer-top-grid { display: grid; grid-template-columns: 2.2fr 1fr 1fr 1.2fr; gap: 36px; margin-bottom: 36px; min-width: 0; }
      @media (max-width: 960px) {
        .footer-top-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
      }
      @media (max-width: 600px) {
        .footer-top-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        .footer-bottom-bar { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
      }
    </style>

    <div style={{ 'maxWidth': '100%', 'width': '100%', 'boxSizing': 'border-box', 'margin': '0 auto', 'padding': '0 16px' }}>
      
      {/*  Top Grid: Brand & Founder Spotlight + Navigation Pillars  */}
      <div className="footer-top-grid">
        
        {/*  Col 1: Brand & Founder Identity  */}
        <div style={{ 'display': 'flex', 'flexDirection': 'column', 'gap': '16px' }}>
          <a href="/" className="brand-group" style={{ 'display': 'inline-flex', 'alignItems': 'center', 'gap': '10px', 'textDecoration': 'none' }}>
            <img src="/logo.svg" alt="getArole Logo" style={{ 'width': '34px', 'height': '34px', 'borderRadius': '9px', 'boxShadow': '0 3px 10px rgba(79,70,229,0.2)', 'flexShrink': '0' }} />
            <span style={{ 'fontFamily': '"Outfit", sans-serif', 'fontSize': '22px', 'fontWeight': '800', 'color': '#0f172a', 'letterSpacing': '-0.03em' }}>get<span style={{ 'color': '#4f46e5' }}>A</span>role</span>
          </a>

          <p style={{ 'fontSize': '13px', 'color': '#475569', 'lineHeight': '1.6', 'maxWidth': '340px', 'margin': '0' }}>
            Job discovery and application management platform indexing verified opportunities directly from official company career portals.
          </p>

          {/*  Founder Spotlight Card (Factual & Enterprise)  */}
          <div style={{ 'background': '#f8fafc', 'border': '1px solid #e2e8f0', 'borderRadius': '14px', 'padding': '14px 16px', 'maxWidth': '390px', 'boxShadow': '0 2px 6px rgba(0,0,0,0.02)', 'display': 'flex', 'alignItems': 'flex-start', 'gap': '14px' }}>
            <div style={{ 'position': 'relative', 'flexShrink': '0' }}>
              <img src="/founder.png" alt="getArole Team" style={{ 'width': '48px', 'height': '48px', 'borderRadius': '50%', 'objectFit': 'cover', 'border': '2px solid #4f46e5', 'boxShadow': '0 2px 6px rgba(79,70,229,0.2)' }} />
              <span style={{ 'position': 'absolute', 'bottom': '0', 'right': '0', 'width': '12px', 'height': '12px', 'background': '#22c55e', 'border': '2px solid #ffffff', 'borderRadius': '50%' }} title="Active Founder"></span>
            </div>
            <div style={{ 'minWidth': '0', 'flex': '1' }}>
              <div style={{ 'display': 'flex', 'alignItems': 'center', 'gap': '6px', 'flexWrap': 'wrap' }}>
                <span style={{ 'fontSize': '13.5px', 'fontWeight': '800', 'color': '#0f172a' }}>getArole Team</span>
                <span style={{ 'fontSize': '10.5px', 'fontWeight': '700', 'background': '#e0e7ff', 'color': '#4338ca', 'padding': '1px 7px', 'borderRadius': '4px' }}>Founder</span>
              </div>
              <div style={{ 'fontSize': '11.5px', 'color': '#64748b', 'marginTop': '2px' }}>Lead Developer &amp; Architect, getArole</div>
              <p style={{ 'fontSize': '11.5px', 'color': '#475569', 'margin': '6px 0 0', 'lineHeight': '1.45' }}>
                Building intelligent tools to accelerate job discovery, optimize ATS resumes, and streamline application tracking for engineers across India.
              </p>
              <div style={{ 'display': 'flex', 'alignItems': 'center', 'gap': '12px', 'marginTop': '9px', 'flexWrap': 'wrap' }}>
                <a href="mailto:admingetarole@gmail.com" style={{ 'fontSize': '11.5px', 'fontWeight': '700', 'color': '#4f46e5', 'textDecoration': 'none', 'display': 'inline-flex', 'alignItems': 'center', 'gap': '4px' }}>
                  <span>✉️ admingetarole@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/*  Col 2: Platform & Real Tools  */}
        <div>
          <div style={{ 'fontSize': '12px', 'fontWeight': '800', 'textTransform': 'uppercase', 'letterSpacing': '0.06em', 'color': '#0f172a', 'marginBottom': '14px' }}>Platform Tools</div>
          <ul style={{ 'listStyle': 'none', 'display': 'flex', 'flexDirection': 'column', 'gap': '10px', 'padding': '0', 'margin': '0' }}>
            <li><a href="/dashboard/" className="footer-nav-link">Application Tracker</a></li>
            <li><a href="/explore/" className="footer-nav-link">Job Discovery &amp; Search</a></li>
            <li><a href="/matches/" className="footer-nav-link">AI Resume Matcher</a></li>
            <li><a href="/resume-builder/" className="footer-nav-link">LaTeX Resume Builder</a></li>
            <li><a href="/cover-letter-builder/" className="footer-nav-link">Cover Letter Builder</a></li>
            <li><a href="/profile/" className="footer-nav-link">Candidate Profile</a></li>
          </ul>
        </div>

        {/*  Col 3: Real Job Categories & Search Hubs  */}
        <div>
          <div style={{ 'fontSize': '12px', 'fontWeight': '800', 'textTransform': 'uppercase', 'letterSpacing': '0.06em', 'color': '#0f172a', 'marginBottom': '14px' }}>Active Hubs</div>
          <ul style={{ 'listStyle': 'none', 'display': 'flex', 'flexDirection': 'column', 'gap': '10px', 'padding': '0', 'margin': '0' }}>
            <li><a href="/explore?q=Bengaluru" className="footer-nav-link">Bengaluru Tech Hub</a></li>
            <li><a href="/explore?q=Hyderabad" className="footer-nav-link">Hyderabad Openings</a></li>
            <li><a href="/explore?q=Pune" className="footer-nav-link">Pune &amp; Mumbai</a></li>
            <li><a href="/explore?q=Gurgaon" className="footer-nav-link">Delhi NCR / Gurgaon</a></li>
            <li><a href="/explore?q=Remote" className="footer-nav-link">Remote in India</a></li>
            <li><a href="/explore?q=Fresher" className="footer-nav-link">Freshers &amp; Early Career</a></li>
          </ul>
        </div>

        {/*  Col 4: Contact, Grievance & Governance  */}
        <div>
          <div style={{ 'fontSize': '12px', 'fontWeight': '800', 'textTransform': 'uppercase', 'letterSpacing': '0.06em', 'color': '#0f172a', 'marginBottom': '14px' }}>Contact &amp; Legal</div>
          <ul style={{ 'listStyle': 'none', 'display': 'flex', 'flexDirection': 'column', 'gap': '10px', 'padding': '0', 'margin': '0' }}>
            <li>
              <a href="mailto:admingetarole@gmail.com" className="footer-nav-link" style={{ 'color': '#4f46e5', 'fontWeight': '700', 'wordBreak': 'break-all' }}>
                admingetarole@gmail.com
              </a>
            </li>
            <li><a href="/privacy/" className="footer-nav-link">Privacy Policy</a></li>
            <li><a href="/terms/" className="footer-nav-link">Terms of Service</a></li>
            <li><a href="/settings/" className="footer-nav-link">Account Settings</a></li>
            <li><a href="mailto:admingetarole@gmail.com?subject=Grievance%20Redressal" className="footer-nav-link">Grievance Redressal</a></li>
            <li style={{ 'marginTop': '4px', 'fontSize': '11.5px', 'color': '#64748b', 'lineHeight': '1.45' }}>
              DPDP Act 2023 Compliant • Direct employer links
            </li>
          </ul>
        </div>

      </div>

      {/*  Bottom Bar: Factual & Clean Enterprise Attribution  */}
      <div className="footer-bottom-bar" style={{ 'borderTop': '1px solid #e2e8f0', 'paddingTop': '20px', 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'fontSize': '12px', 'color': '#64748b', 'flexWrap': 'wrap', 'gap': '14px' }}>
        <div style={{ 'display': 'flex', 'alignItems': 'center', 'gap': '8px', 'flexWrap': 'wrap' }}>
          <span>© <span className="global-footer-year">2026</span> <strong>getArole.in</strong></span>
        </div>
        
        <div style={{ 'display': 'flex', 'alignItems': 'center', 'gap': '14px', 'fontSize': '11.5px', 'color': '#64748b', 'flexWrap': 'wrap' }}>
          <span>Verified Opportunities • Direct Application Links</span>
          <span>•</span>
          <a href="mailto:admingetarole@gmail.com" style={{ 'color': '#4f46e5', 'textDecoration': 'none', 'fontWeight': '600' }}>Contact Founder</a>
        </div>
      </div>

    </div>
  </footer>
  );
}

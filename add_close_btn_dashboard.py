import re

f = "web/static/dashboard/index.html"
with open(f, "r") as file:
    content = file.read()

# Add window.closeMobileJD
if "window.closeMobileJD" not in content:
    content = content.replace(
        "function selectMatchJob",
        "window.closeMobileJD = function() { document.body.classList.remove('mobile-jd-open'); };\n\n    function selectMatchJob"
    )

# Add the back button HTML
header_html = """        <div class="jd-sticky-header" style="background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 16px;z-index:999;position:sticky;top:0;">
          <button class="mobile-jd-back-btn" onclick="closeMobileJD()" type="button" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:#0f172a;font-weight:700;font-size:15px;cursor:pointer;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
            <span>Back</span>
          </button>
        </div>
        <div class="detail-actions-bar">"""

content = content.replace("        <div class=\"detail-actions-bar\">", header_html)

with open(f, "w") as file:
    file.write(content)

print("Dashboard back button added.")

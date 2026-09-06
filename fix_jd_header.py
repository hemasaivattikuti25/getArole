import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # 1. Remove the old back button from jd-top-bar
    old_back_btn = """            <button class="mobile-jd-back-btn" onclick="closeMobileJD()" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              <span>Back</span>
            </button>"""
    
    content = content.replace(old_back_btn, "")
    
    # 2. Insert the new back button into top-action-group
    target = '<div class="top-action-group">'
    new_back_btn = """<div class="top-action-group">
              <button class="mobile-jd-back-btn" onclick="closeMobileJD()" type="button" title="Back" style="padding: 8px; border-radius: 8px; margin-right: auto;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>"""
    content = content.replace(target, new_back_btn)
    
    # 3. Hide jd-top-bar entirely on mobile
    if "body.mobile-jd-open .jd-top-bar {" not in content:
        mobile_css_target = "body.mobile-jd-open .jd-sticky-header {"
        new_mobile_css = """      body.mobile-jd-open .jd-top-bar { display: none !important; }
      body.mobile-jd-open .jd-sticky-header {"""
        content = content.replace(mobile_css_target, new_mobile_css)
    
    with open(f, "w") as file:
        file.write(content)
    print(f"Restructured JD header in {f}")

# 4. Fix mobile-nav.js top and height for job-detail-col
f_nav = "web/static/js/mobile-nav.js"
with open(f_nav, "r") as file:
    content = file.read()

old_col_css = """      body.mobile-jd-open .job-detail-col {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;"""

new_col_css = """      body.mobile-jd-open .job-detail-col {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 56px !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: calc(100vh - 56px) !important;
        height: calc(100dvh - 56px) !important;"""

content = content.replace(old_col_css, new_col_css)

with open(f_nav, "w") as file:
    file.write(content)
print("Fixed job-detail-col top and height in mobile-nav.js")


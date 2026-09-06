import re

# 1. Add Matches and Explore to mobile-nav.js
f = "web/static/js/mobile-nav.js"
with open(f, "r") as file:
    content = file.read()

nav_target = '<div style="padding: 10px 20px 4px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">AI Career Tools</div>'
nav_addition = """<div style="padding: 10px 20px 4px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Job Discovery</div>
          <a href="/explore/" class="mobile-nav-link ${path.startsWith('/explore/') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            Explore Jobs
          </a>
          <a href="/matches/" class="mobile-nav-link ${path.startsWith('/matches/') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Match Resume
          </a>
          <div style="height: 1px; background: #e2e8f0; margin: 8px 0;"></div>
          """

if "Explore Jobs" not in content and nav_target in content:
    content = content.replace(nav_target, nav_addition + nav_target)
    with open(f, "w") as file:
        file.write(content)
    print("Added Explore and Matches to mobile-nav.js")

# 2. Remove Account & Security tab button and section from profile/index.html
f2 = "web/static/profile/index.html"
with open(f2, "r") as file:
    html_content = file.read()

# Remove the Account & Security tab button
html_content = re.sub(
    r'<a href="#" class="new-hub-btn" id="btn-tab-account"[^>]*>.*?Account &amp; Security.*?</a>',
    '',
    html_content,
    flags=re.DOTALL
)

# Remove the SECTION 9: DANGER ZONE & ACCOUNT PURGE block entirely
html_content = re.sub(
    r'<!-- SECTION 9: DANGER ZONE & ACCOUNT PURGE -->.*?</div>\s*</div>',
    '',
    html_content,
    flags=re.DOTALL
)

with open(f2, "w") as file:
    file.write(html_content)

print("Removed Account & Security from profile/index.html")

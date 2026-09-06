import re
import os

# 1. Fix the back button visibility on mobile
f_nav = "web/static/js/mobile-nav.js"
with open(f_nav, "r") as file:
    content = file.read()

# Add display:flex to mobile-jd-back-btn on mobile
if "body.mobile-jd-open .mobile-jd-back-btn" not in content:
    mobile_css_target = "body.mobile-jd-open .jd-sticky-header {"
    new_mobile_css = """      body.mobile-jd-open .mobile-jd-back-btn {
        display: flex !important;
      }
      body.mobile-jd-open .jd-sticky-header {"""
    content = content.replace(mobile_css_target, new_mobile_css)

    with open(f_nav, "w") as file:
        file.write(content)
    print("Fixed back button in mobile-nav.js")

# 2. Remove the "Already Applied" button from explore and matches
for f in ["web/static/explore/index.html", "web/static/matches/index.html"]:
    with open(f, "r") as file:
        content = file.read()
    
    # Regex to remove the btn-applied-toggle button in the JS template literal
    # It looks like:
    # <button class="btn-applied-toggle ${isApplied ? 'applied' : ''}" onclick="toggleApplied('${job.id}')" type="button">
    #   ${isApplied ? '✓ Applied' : 'Already Applied?'}
    # </button>
    content = re.sub(
        r'<button\s+class="btn-applied-toggle[^>]+>\s*\$\{isApplied\s*\?\s*\'✓ Applied\'\s*:\s*\'Already Applied\?\'\}\s*</button>',
        '',
        content,
        flags=re.MULTILINE
    )
    
    with open(f, "w") as file:
        file.write(content)
    print(f"Removed Already Applied button from {f}")

print("Done fixing JD UI.")

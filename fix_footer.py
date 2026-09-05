import re

f = "web/static/dashboard/index.html"
with open(f, "r") as file:
    content = file.read()

# Extract the footer
match = re.search(r'<footer class="global-footer".*?</footer>', content, re.DOTALL)
if match:
    footer = match.group(0)
    
    # 1. Replace logo with founder pic in the Founder Spotlight Card
    # Look for the img src="/logo.svg" under the spotlight card and change it
    # We know it's inside `<div style="position:relative; flex-shrink:0;">`
    pattern_img = r'(<div style="position:relative; flex-shrink:0;">\s*<img src=")/logo.svg(" alt="getArole Team")'
    footer = re.sub(pattern_img, r'\1/founder.png\2', footer)
    
    # 2. Remove "Built by getArole Team", "Bengaluru, Karnataka, India" and the bullets in the bottom bar
    # The bottom bar looks like:
    # <span>© <span class="global-footer-year">2026</span> <strong>getArole.in</strong></span>
    # <span>•</span>
    # <span>Built by getArole Team</span>
    # <span>•</span>
    # <span>Bengaluru, Karnataka, India</span>
    
    # Let's just remove the <span>•</span>... and everything after getArole.in
    pattern_bottom = r'(<span>© <span class="global-footer-year">2026</span> <strong>getArole\.in</strong></span>)\s*<span>•</span>\s*<span>Built by getArole Team</span>\s*<span>•</span>\s*<span>Bengaluru, Karnataka, India</span>'
    footer = re.sub(pattern_bottom, r'\1', footer)

    with open("scratch_footer.html", "w") as out:
        out.write(footer)
    print("Cleaned footer extracted to scratch_footer.html")
else:
    print("Footer not found in dashboard!")

import re
import os

with open("scratch_footer.html", "r") as f:
    clean_footer = f.read()

files = [
    "web/static/index.html",
    "web/static/dashboard/index.html",
    "web/static/explore/index.html",
    "web/static/matches/index.html",
    "web/static/profile/index.html",
    "web/static/settings/index.html",
    "web/static/privacy/index.html",
    "web/static/terms/index.html"
]

for f in files:
    if not os.path.exists(f):
        continue
    with open(f, "r") as file:
        content = file.read()
    
    # Replace existing footer
    # Use re.DOTALL to match across newlines
    content = re.sub(r'<footer class="global-footer".*?</footer>', clean_footer, content, flags=re.DOTALL)
    
    with open(f, "w") as file:
        file.write(content)

print("All Vanilla footers successfully updated.")

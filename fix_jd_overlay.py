import re

files = [
    "web/static/explore/index.html",
    "web/static/matches/index.html"
]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # Replace the else block that closes the overlay
    # We will use regex to find it safely
    pattern = r"if \(isUserClick\) \{\s*document\.body\.classList\.add\('mobile-jd-open'\);\s*window\.scrollTo\(0, 0\);\s*\} else \{\s*document\.body\.classList\.remove\('mobile-jd-open'\);\s*\}"
    replacement = r"if (isUserClick) { document.body.classList.add('mobile-jd-open'); window.scrollTo(0, 0); }"
    
    content = re.sub(pattern, replacement, content)
    
    with open(f, "w") as file:
        file.write(content)

print("JD overlay logic fixed.")

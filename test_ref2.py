import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # We must ensure that jd-sticky-header doesn't have overflow: hidden
    if ".jd-sticky-header {" in content:
        content = content.replace(".jd-sticky-header {", ".jd-sticky-header {\n      overflow: visible !important;")
        
    with open(f, "w") as file:
        file.write(content)
        
print("Fixed jd-sticky-header overflow")

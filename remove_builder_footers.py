import re

files = [
    "web/static/resume-builder/index.html",
    "web/static/cover-letter-builder/index.html"
]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # Remove everything from <footer class="global-footer" to </footer>
    content = re.sub(r'<footer class="global-footer".*?</footer>', '', content, flags=re.DOTALL)
    
    with open(f, "w") as file:
        file.write(content)

print("Footers removed from builders.")

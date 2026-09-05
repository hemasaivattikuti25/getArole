import re

f = "web/static/cover-letter-builder/index.html"
with open(f, "r") as file:
    content = file.read()

# 1. Font Import
content = content.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">'
)

# 2. Update CSS Variables (the main ones)
content = content.replace("--primary: #0071e3;", "--primary: #4f46e5;")
content = content.replace("--primary-hover: #0077ed;", "--primary-hover: #4338ca;")
content = content.replace("--primary-accent: #0071e3;", "--primary-accent: #4f46e5;")
content = content.replace("--primary-light: #e8f0fe;", "--primary-light: #eef2ff;")
content = content.replace("--primary-border: #bfdbfe;", "--primary-border: #c7d2fe;")
content = content.replace(
    "--primary-gradient: linear-gradient(135deg, #0071e3 0%, #4facfe 100%);",
    "--primary-gradient: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);"
)
content = content.replace("--border-glow: rgba(0, 113, 227, 0.25);", "--border-glow: rgba(79, 70, 229, 0.25);")
content = content.replace("--shadow-glow: 0 0 35px rgba(0, 113, 227, 0.15);", "--shadow-glow: 0 0 35px rgba(79, 70, 229, 0.15);")

# 3. Update Font Families
content = content.replace(
    "font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;",
    "font-family: 'Plus Jakarta Sans', sans-serif;"
)
content = content.replace("font-family: 'Inter'", "font-family: 'Plus Jakarta Sans'")

# 4. Inject Outfit for headings
# Find "body {" and inject heading rule right after it
# Actually, the user's CL builder already has a rule for h1, h2
content = re.sub(
    r'(body\s*\{.*?\})',
    r"\1\n    h1, h2, h3, h4 { font-family: 'Outfit', sans-serif; letter-spacing: -.02em; }",
    content,
    flags=re.DOTALL
)

with open(f, "w") as file:
    file.write(content)

print("Cover letter theme synced to Indigo/Outfit/PlusJakarta.")

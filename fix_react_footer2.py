import re

with open("frontend/src/components/Footer.tsx", "r") as f:
    content = f.read()

# Fix font-family issues
content = content.replace('\'"Plus Jakarta Sans"\', -apple-system, BlinkMacSystemFont, sans-serif\'', '\'"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif\'')
content = content.replace('\'\'Outfit\', sans-serif\'', '\'"Outfit", sans-serif\'')

# Fix HTML comments to JSX comments
content = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', content)

with open("frontend/src/components/Footer.tsx", "w") as f:
    f.write(content)

print("Footer.tsx JSX fixed.")

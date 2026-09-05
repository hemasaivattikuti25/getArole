import re

with open("scratch_footer.html", "r") as f:
    html = f.read()

# Make it valid JSX
# 1. class -> className
html = html.replace('class=', 'className=')

# 2. style="key: value; key: value;" -> style={{ key: 'value', key: 'value' }}
def style_to_jsx(match):
    style_str = match.group(1)
    if not style_str.strip():
        return 'style={{}}'
    
    pairs = []
    for pair in style_str.split(';'):
        if ':' in pair:
            k, v = pair.split(':', 1)
            k = k.strip()
            v = v.strip()
            
            # Convert kebab-case to camelCase
            k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            
            pairs.append(f"'{k}': '{v}'")
            
    return 'style={{ ' + ', '.join(pairs) + ' }}'

html = re.sub(r'style="([^"]*)"', style_to_jsx, html)

# 3. self closing tags
html = re.sub(r'(<img[^>]*?[^\/])>', r'\1 />', html)
html = re.sub(r'(<br[^>]*?[^\/])>', r'\1 />', html)

jsx_content = f""""use client";

import Link from "next/link";
import React from "react";

export default function Footer() {{
  return (
{html}
  );
}}
"""

with open("frontend/src/components/Footer.tsx", "w") as f:
    f.write(jsx_content)

print("React Footer generated successfully.")

import re

f = "web/static/profile/index.html"
with open(f, "r") as file:
    content = file.read()

# 1. Remove the link to Danger Zone
content = re.sub(r'<span class="btn-sub">Danger Zone &amp; GDPR Purge</span>', '', content)

# 2. Remove the actual Danger Zone section (Section 9)
# We need to find the start and end of it.
# It starts with: <!-- SECTION 9: DANGER ZONE & ACCOUNT PURGE -->
# And ends before the `<script>` tag or the footer.
pattern = r'<!-- SECTION 9: DANGER ZONE & ACCOUNT PURGE -->.*?<!-- ════════════════════ FOOTER ════════════════════ -->'
replacement = '<!-- ════════════════════ FOOTER ════════════════════ -->'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(f, "w") as file:
    file.write(content)

print("Profile page fixed.")

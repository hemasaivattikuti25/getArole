import re

f = "web/static/js/mobile-nav.js"
with open(f, "r") as file:
    content = file.read()

# 1. Remove the duplicated "Home" button from the mobile-bottom-nav
# It looks exactly like:
#         <a href="/" class="mobile-nav-link ${path === '/' || path.startsWith('/dashboard') ? 'active' : ''}">
#             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
#             Home
#           </a>
# Note: we only want to remove it if it's inside mobile-bottom-nav.
# But actually, the one in mobile-bottom-nav is exactly identical to the one in the drawer because I replaced BOTH.
# So I'll find the bottom nav block and remove the `<a href="/" class="mobile-nav-link"...` from it.

# Split content into bottom nav section and drawer section
parts = content.split('<nav class="mobile-nav-list">')
if len(parts) == 2:
    bottom_nav = parts[0]
    drawer = parts[1]
    
    # Remove the bad Home link from bottom nav
    bad_home = """        <a href="/" class="mobile-nav-link ${path === '/' || path.startsWith('/dashboard') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
          </a>
          """
    bottom_nav = bottom_nav.replace(bad_home, "")
    
    # Change the href in the drawer from "/" to "/dashboard/"
    drawer = drawer.replace('<a href="/" class="mobile-nav-link', '<a href="/dashboard/" class="mobile-nav-link')
    
    # Reassemble
    content = bottom_nav + '<nav class="mobile-nav-list">' + drawer

with open(f, "w") as file:
    file.write(content)

print("Fixed the Home button mess in mobile-nav.js")

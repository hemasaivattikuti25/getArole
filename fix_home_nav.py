f = "web/static/js/mobile-nav.js"
with open(f, "r") as file:
    content = file.read()

nav_target = '<a href="/explore/"'
nav_addition = """<a href="/" class="mobile-nav-link ${path === '/' || path.startsWith('/dashboard') ? 'active' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
          </a>
          """

if "Home" not in content.split("Job Discovery")[1].split("Explore Jobs")[0]:
    content = content.replace(nav_target, nav_addition + nav_target)
    with open(f, "w") as file:
        file.write(content)
    print("Added Home to mobile-nav.js")


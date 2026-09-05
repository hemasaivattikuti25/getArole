import re

f = "web/static/index.html"
with open(f, "r") as file:
    content = file.read()

# Replace the initAuthListener in index.html to auto-redirect
old_listener = """    initAuthListener((user) => {
      const actions = document.querySelector('.nav-actions');
      if (user && actions) {
        actions.innerHTML = `
          <a href="/dashboard/" class="btn btn-secondary">Dashboard</a>
          <button onclick="window.handleLogout()" class="btn btn-primary" style="padding:8px 14px;">Sign Out</button>
        `;
      }
    });"""

new_listener = """    initAuthListener((user) => {
      if (user) {
        // Auto-redirect logged-in users to the dashboard
        window.location.href = "/dashboard/";
      }
    });"""

content = content.replace(old_listener, new_listener)

with open(f, "w") as file:
    file.write(content)

print("Vanilla index.html auto-redirect added.")

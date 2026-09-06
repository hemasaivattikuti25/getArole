import re

f = "web/static/profile/index.html"
with open(f, "r") as file:
    content = file.read()

# Add a specific phone purge
old_purge = """        if (state.profile.name === 'Hemasai Vattikuti' && state.profile.email === 'hemasai@getarole.in') {
          state.profile = {};
          localStorage.removeItem('getarole_profile');
        }"""

new_purge = """        if (state.profile.name === 'Hemasai Vattikuti' && state.profile.email === 'hemasai@getarole.in') {
          state.profile = {};
          localStorage.removeItem('getarole_profile');
        }
        if (state.profile.phone === '+91 98765 43210' || state.profile.phone === '+91 9876543210') {
          state.profile.phone = '';
        }"""

content = content.replace(old_purge, new_purge)

with open(f, "w") as file:
    file.write(content)

f = "web/static/js/storage-sync.js"
with open(f, "r") as file:
    content = file.read()

old_purge = """      if (existingProfile.name === 'Hemasai Vattikuti' && existingProfile.email === 'hemasai@getarole.in') {
        existingProfile = {};
        localStorage.removeItem('getarole_profile');
      }"""

new_purge = """      if (existingProfile.name === 'Hemasai Vattikuti' && existingProfile.email === 'hemasai@getarole.in') {
        existingProfile = {};
        localStorage.removeItem('getarole_profile');
      }
      if (existingProfile.phone === '+91 98765 43210' || existingProfile.phone === '+91 9876543210') {
        existingProfile.phone = '';
      }"""

content = content.replace(old_purge, new_purge)

with open(f, "w") as file:
    file.write(content)

print("Mock phone purge added.")

import re

f = "frontend/src/app/(app)/profile/page.tsx"
with open(f, "r") as file:
    content = file.read()

old_load = """      if (profData) {
        const parsed = JSON.parse(profData);
        setProfile((prev: any) => ({ ...prev, ...parsed }));
      }"""

new_load = """      if (profData) {
        const parsed = JSON.parse(profData);
        if (parsed.phone === '+91 98765 43210' || parsed.phone === '+91 9876543210') {
          parsed.phone = '';
        }
        setProfile((prev: any) => ({ ...prev, ...parsed }));
      }"""

content = content.replace(old_load, new_load)

with open(f, "w") as file:
    file.write(content)

print("Next.js profile phone purge added.")

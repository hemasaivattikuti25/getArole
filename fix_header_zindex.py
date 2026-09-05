import re
import os

files = [
    "web/static/dashboard/index.html",
    "web/static/explore/index.html",
    "web/static/matches/index.html",
    "web/static/profile/index.html",
    "web/static/resume-builder/index.html",
    "web/static/cover-letter-builder/index.html"
]

for f in files:
    if not os.path.exists(f):
        continue
    with open(f, "r") as file:
        content = file.read()
    
    # Replace the aggressive z-index in the inline style of the header
    # From: <header style="position: sticky; top: 0; z-index: 999999 !important; width: 100%;">
    # To: <header style="position: sticky; top: 0; z-index: 999 !important; width: 100%;">
    content = content.replace("z-index: 999999 !important;", "z-index: 999 !important;")
    
    with open(f, "w") as file:
        file.write(content)

print("Header z-index fixed in all files.")

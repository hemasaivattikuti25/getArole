import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # Add width: 100% to top-action-group CSS
    content = content.replace(".top-action-group { display: flex; align-items: center; gap: 8px; }", 
                              ".top-action-group { display: flex; align-items: center; gap: 8px; width: 100%; }")
    
    with open(f, "w") as file:
        file.write(content)

print("Fixed top-action-group width")

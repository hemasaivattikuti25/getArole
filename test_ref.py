import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # Check if there is anything hiding the top-action-group in mobile
    if ".top-action-group { display: flex; align-items: center; gap: 8px; width: 100%; }" in content:
        # let's make sure it handles overflow correctly
        content = content.replace(".top-action-group { display: flex; align-items: center; gap: 8px; width: 100%; }", 
                                  ".top-action-group { display: flex; align-items: center; gap: 8px; width: 100%; overflow: visible; }")

    with open(f, "w") as file:
        file.write(content)
        
print("Fixed top-action-group overflow")

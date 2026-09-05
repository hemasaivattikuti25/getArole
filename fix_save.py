import re

files = [
    "web/static/dashboard/index.html",
    "web/static/explore/index.html",
    "web/static/matches/index.html"
]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    if 'city: (modalPrefs.locations && modalPrefs.locations[0]) || \'\'' in content and 'seniority: modalPrefs.seniority || \'mid\',' not in content:
        content = content.replace(
            'city: (modalPrefs.locations && modalPrefs.locations[0]) || \'\'',
            'city: (modalPrefs.locations && modalPrefs.locations[0]) || \'\',\n        seniority: modalPrefs.seniority || \'mid\',\n        companySize: modalPrefs.companySize || \'Any\''
        )
    
    with open(f, "w") as file:
        file.write(content)

print("Save function updated in all files.")

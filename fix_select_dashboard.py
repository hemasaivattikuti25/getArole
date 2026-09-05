import re

f = "web/static/dashboard/index.html"

with open(f, "r") as file:
    content = file.read()

# Update function definition
content = content.replace(
    "function selectMatchJob(id) {",
    "function selectMatchJob(id, isUserClick = false) {"
)

# Update function call inside definition
content = content.replace(
    "selectJob(id, 'matches-detail-pane');",
    "selectJob(id, 'matches-detail-pane', isUserClick);"
)

# Update HTML onclicks for selectMatchJob
content = content.replace(
    "onclick=\"selectMatchJob('${j.id}')\"",
    "onclick=\"selectMatchJob('${j.id}', true)\""
)

with open(f, "w") as file:
    file.write(content)

print("selectMatchJob dashboard fixed.")

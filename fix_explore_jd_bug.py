f = "web/static/explore/index.html"
with open(f, "r") as file:
    content = file.read()

# Fix the programmatic selectJob passing 'true'
old_call = "selectJob(filteredJobs[0].id, 'job-detail-pane', true);"
new_call = "selectJob(filteredJobs[0].id, 'job-detail-pane', false);"
content = content.replace(old_call, new_call)

with open(f, "w") as file:
    file.write(content)
print("Fixed explore JD auto-open bug.")

f = "frontend/src/app/(app)/profile/page.tsx"
with open(f, "r") as file:
    content = file.read()

content = content.replace('phone: "+91 98765 43210"', 'phone: ""')

with open(f, "w") as file:
    file.write(content)

print("Hardcoded phone number removed from React state")

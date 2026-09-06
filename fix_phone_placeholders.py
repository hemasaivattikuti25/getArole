import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r') as file:
        content = file.read()
    
    # Replace the confusing placeholder
    new_content = content.replace('placeholder="+91 98765 43210"', 'placeholder="e.g., +91 98765 00000"')
    
    if new_content != content:
        with open(filepath, 'w') as file:
            file.write(new_content)
        print(f"Fixed {filepath}")

for root, dirs, files in os.walk('web/static'):
    for file in files:
        if file.endswith('.html'):
            replace_in_file(os.path.join(root, file))

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))

print("Done replacing placeholders.")

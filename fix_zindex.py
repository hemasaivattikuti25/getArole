import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # We must ensure that jd-sticky-header z-index is higher than anything else
    # and the referral dropdown has z-index 999999 (super high)
    
    if ".jd-sticky-header {" in content:
        content = content.replace("z-index: 60;", "z-index: 1000;")
    
    # Check top-action-bar overflow
    if ".top-action-bar {" in content:
        content = content.replace(".top-action-bar {\n      display: flex; align-items: center; justify-content: space-between; gap: 10px;\n      padding: 0; margin-bottom: 0;\n    }", ".top-action-bar {\n      display: flex; align-items: center; justify-content: space-between; gap: 10px;\n      padding: 0; margin-bottom: 0; overflow: visible !important;\n    }")

    # Check top-action-group overflow
    content = content.replace("overflow: visible;", "overflow: visible !important;")
        
    with open(f, "w") as file:
        file.write(content)
        
print("Fixed jd-sticky-header overflow and z-index")

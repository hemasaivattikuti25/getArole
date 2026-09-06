import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # We are hiding .btn-ref-text on mobile, which is why the referral button looks invisible or just an icon.
    # Let's remove that hidden rule so the word "Referrals" is visible!
    content = content.replace(".btn-ref-text { display: none !important; }", "")
    
    # Let's also check if there is an issue with z-index for the referral menu wrap
    # We need to make sure top-action-group allows the dropdown to be visible
    # In .referral-dropdown, let's make sure z-index is super high on mobile
    if "z-index: 99999 !important;" not in content:
        content = content.replace("z-index: 999 !important;", "z-index: 99999 !important;")
        
    with open(f, "w") as file:
        file.write(content)
    print(f"Fixed referral visibility in {f}")


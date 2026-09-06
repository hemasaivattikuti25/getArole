import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()

    # The mobile dropdown CSS is set to `bottom: 0 !important; top: auto !important; position: fixed !important;`
    # But sometimes the `display` attribute is messed up by other mobile classes.
    # Let's add a `display: flex !important;` explicitly to `.referral-dropdown.show` at the mobile level
    
    mobile_css_target = ".referral-dropdown {"
    
    # We want to make sure the dropdown itself is actually visible. 
    # The .referral-dropdown is initially `display: none`.
    # Let's check the global `.referral-dropdown.show` rules.
    content = content.replace(".referral-dropdown.show { display: flex; }", ".referral-dropdown.show { display: flex !important; }")

    with open(f, "w") as file:
        file.write(content)
    print(f"Fixed mobile dropdown display CSS in {f}")


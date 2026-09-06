import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    old_col_css = """      body.mobile-jd-open .job-detail-col {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;"""

    new_col_css = """      body.mobile-jd-open .job-detail-col {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        top: 56px !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: calc(100vh - 56px) !important;
        height: calc(100dvh - 56px) !important;"""

    content = content.replace(old_col_css, new_col_css)
    
    # Let's also ensure jd-top-bar is hidden as intended, in case they have inline rules for it
    if "body.mobile-jd-open .jd-top-bar { display: none !important; }" not in content:
        # It's already there from previous script
        pass
        
    with open(f, "w") as file:
        file.write(content)
    print(f"Fixed inline job-detail-col top offset in {f}")


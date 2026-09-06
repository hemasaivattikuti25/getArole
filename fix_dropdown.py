import re

files = ["web/static/explore/index.html", "web/static/matches/index.html"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # Let's fix the referral dropdown logic in JS so it sets style.display explicitly when toggled 
    # instead of just relying on .show class which might be getting overridden by inline styles or other media queries
    
    old_js = """    function toggleReferralDropdown(jobId, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      const targetDropdown = document.getElementById(`ref-dropdown-${jobId}`);
      const wasOpen = targetDropdown && targetDropdown.classList.contains('show');
      
      closeAllReferralDropdowns();
      
      if (!wasOpen && targetDropdown) {
        targetDropdown.classList.add('show');
      }
    }"""
    
    new_js = """    function toggleReferralDropdown(jobId, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      const targetDropdown = document.getElementById(`ref-dropdown-${jobId}`);
      const wasOpen = targetDropdown && targetDropdown.classList.contains('show');
      
      closeAllReferralDropdowns();
      
      if (!wasOpen && targetDropdown) {
        targetDropdown.classList.add('show');
        targetDropdown.style.display = 'flex';
      }
    }"""
    
    old_close_js = """    function closeAllReferralDropdowns(event) {
      if (event) event.stopPropagation();
      document.querySelectorAll('.referral-dropdown.show').forEach(d => {
        d.classList.remove('show');
      });
    }"""
    
    new_close_js = """    function closeAllReferralDropdowns(event) {
      if (event) event.stopPropagation();
      document.querySelectorAll('.referral-dropdown').forEach(d => {
        d.classList.remove('show');
        d.style.display = '';
      });
    }"""
    
    content = content.replace(old_js, new_js)
    content = content.replace(old_close_js, new_close_js)
    
    # Ensure button itself isn't display:none anywhere
    content = content.replace(".btn-referral { display: none; }", "")
    content = content.replace(".btn-referral { display: none !important; }", "")
    content = content.replace(".referral-menu-wrap { display: none; }", "")
    content = content.replace(".referral-menu-wrap { display: none !important; }", "")
    
    with open(f, "w") as file:
        file.write(content)
    print(f"Fixed JS dropdown visibility in {f}")


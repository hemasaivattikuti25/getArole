import re

files = [
    "web/static/dashboard/index.html",
    "web/static/explore/index.html",
    "web/static/matches/index.html"
]

seniority_html = """
        <!-- SECTION 3.1: SENIORITY LEVEL -->
        <div>
          <label style="font-size:13.5px; font-weight:800; color:var(--text-main); display:block; margin-bottom:8px;">📈 3.1 Seniority Level</label>
          <div style="display:flex; flex-wrap:wrap; gap:6px;" id="modal-seniority-chips">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- SECTION 3.2: COMPANY SIZE -->
        <div>
          <label style="font-size:13.5px; font-weight:800; color:var(--text-main); display:block; margin-bottom:8px;">🏢 3.2 Preferred Company Size</label>
          <div style="display:flex; flex-wrap:wrap; gap:6px;" id="modal-companySize-chips">
            <!-- Dynamically populated -->
          </div>
        </div>
"""

seniority_js = """
    const modalSeniorities = ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'];
    const modalCompanySizes = ['Any', 'Startup', 'Mid-Size', 'Enterprise'];

    function renderModalSeniority() {
      const container = document.getElementById('modal-seniority-chips');
      if(!container) return;
      const current = (modalPrefs.seniority || 'mid').toLowerCase();
      container.innerHTML = modalSeniorities.map(lvl => {
        const isSel = current === lvl.toLowerCase();
        return `<div class="choice-chip ${isSel ? 'selected' : ''}" style="padding:6px 12px; font-size:12px;" onclick="toggleModalSeniority('${lvl}')">${lvl} ${isSel ? '✓' : ''}</div>`;
      }).join('');
    }

    function toggleModalSeniority(lvl) {
      modalPrefs.seniority = lvl.toLowerCase();
      renderModalSeniority();
    }

    function renderModalCompanySize() {
      const container = document.getElementById('modal-companySize-chips');
      if(!container) return;
      const current = (modalPrefs.companySize || 'Any');
      container.innerHTML = modalCompanySizes.map(lvl => {
        const isSel = current === lvl;
        return `<div class="choice-chip ${isSel ? 'selected' : ''}" style="padding:6px 12px; font-size:12px;" onclick="toggleModalCompanySize('${lvl}')">${lvl} ${isSel ? '✓' : ''}</div>`;
      }).join('');
    }

    function toggleModalCompanySize(lvl) {
      modalPrefs.companySize = lvl;
      renderModalCompanySize();
    }
"""

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    # 1. Insert HTML after Experience Level
    if '<!-- SECTION 4: LOCATIONS' in content and '<!-- SECTION 3.1' not in content:
        content = content.replace(
            '<!-- SECTION 4: LOCATIONS',
            seniority_html + '\n        <!-- SECTION 4: LOCATIONS'
        )
    
    # 2. Insert JS variables and render functions
    if 'function renderModalExp' in content and 'function renderModalSeniority' not in content:
        content = content.replace(
            'function renderModalExp',
            seniority_js + '\n    function renderModalExp'
        )
    
    # 3. Add to render calls
    if 'renderModalExp();' in content and 'renderModalSeniority();' not in content:
        content = content.replace(
            'renderModalExp();',
            'renderModalExp();\n      renderModalSeniority();\n      renderModalCompanySize();'
        )
    
    with open(f, "w") as file:
        file.write(content)

print("Modals updated in all files.")

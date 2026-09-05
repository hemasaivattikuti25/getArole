import re

f = "web/static/index.html"
with open(f, "r") as file:
    content = file.read()

# Replace the buggy auth redirect logic
old_logic = """      if (!isExplicitSignUp && (hasCloudPrefs || localPrefs || onboardingCompleted)) {
        window.location.href = "/dashboard/";
      } else {
        window.location.href = (isExplicitSignUp || (!hasCloudPrefs && !onboardingCompleted)) ? "/onboarding/" : "/dashboard/";
      }"""

new_logic = """      // If explicit sign up OR (no cloud prefs and not completed), force onboarding
      if (isExplicitSignUp || (!hasCloudPrefs && !onboardingCompleted)) {
        window.location.href = "/onboarding/";
      } else {
        window.location.href = "/dashboard/";
      }"""

content = content.replace(old_logic, new_logic)

with open(f, "w") as file:
    file.write(content)

print("Auth redirect logic fixed.")

import re

f = "frontend/src/components/auth/AuthModal.tsx"
with open(f, "r") as file:
    content = file.read()

# Replace router.push with window.location.href
# And move onClose() to AFTER window.location.href just to be safe
content = re.sub(
    r'onClose\(\);\s*const hasCloudPrefs = !!localStorage\.getItem\("getarole_cloud_prefs"\);\s*const onboardingCompleted = localStorage\.getItem\("getarole_onboarding_completed"\) === "true";\s*if \(!hasCloudPrefs && !onboardingCompleted\) \{\s*router\.push\("/onboarding/"\);\s*\} else \{\s*router\.push\("/dashboard/"\);\s*\}',
    """const hasCloudPrefs = !!localStorage.getItem("getarole_cloud_prefs");
      const onboardingCompleted = localStorage.getItem("getarole_onboarding_completed") === "true";
      if (!hasCloudPrefs && !onboardingCompleted) {
        window.location.href = "/onboarding/";
      } else {
        window.location.href = "/dashboard/";
      }
      onClose();""",
    content
)

# And for the handleEmailSubmit (it has a slightly different condition: `isSignUp || (!hasCloudPrefs && !onboardingCompleted)`)
content = re.sub(
    r'onClose\(\);\s*const hasCloudPrefs = !!localStorage\.getItem\("getarole_cloud_prefs"\);\s*const onboardingCompleted = localStorage\.getItem\("getarole_onboarding_completed"\) === "true";\s*if \(isSignUp \|\| \(!hasCloudPrefs && !onboardingCompleted\)\) \{\s*router\.push\("/onboarding/"\);\s*\} else \{\s*router\.push\("/dashboard/"\);\s*\}',
    """const hasCloudPrefs = !!localStorage.getItem("getarole_cloud_prefs");
      const onboardingCompleted = localStorage.getItem("getarole_onboarding_completed") === "true";
      if (isSignUp || (!hasCloudPrefs && !onboardingCompleted)) {
        window.location.href = "/onboarding/";
      } else {
        window.location.href = "/dashboard/";
      }
      onClose();""",
    content
)

with open(f, "w") as file:
    file.write(content)

print("AuthModal.tsx fixed.")

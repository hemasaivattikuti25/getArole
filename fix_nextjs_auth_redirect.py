import re

f = "frontend/src/components/auth/AuthModal.tsx"
with open(f, "r") as file:
    content = file.read()

# Add useRouter import
content = content.replace('import { useAuth } from "@/providers/auth-provider";', 'import { useAuth } from "@/providers/auth-provider";\nimport { useRouter } from "next/navigation";')

# Add useRouter hook
content = content.replace('const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();', 'const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();\n  const router = useRouter();')

# Fix handleGoogle
old_google = """    if (res.success) {
      onClose();
    } else {"""

new_google = """    if (res.success) {
      onClose();
      const hasCloudPrefs = !!localStorage.getItem("getarole_cloud_prefs");
      const onboardingCompleted = localStorage.getItem("getarole_onboarding_completed") === "true";
      if (!hasCloudPrefs && !onboardingCompleted) {
        router.push("/onboarding/");
      } else {
        router.push("/dashboard/");
      }
    } else {"""

content = content.replace(old_google, new_google)

# Fix handleEmailSubmit
old_email = """    if (res.success) {
      onClose();
    } else {"""

new_email = """    if (res.success) {
      onClose();
      const hasCloudPrefs = !!localStorage.getItem("getarole_cloud_prefs");
      const onboardingCompleted = localStorage.getItem("getarole_onboarding_completed") === "true";
      if (isSignUp || (!hasCloudPrefs && !onboardingCompleted)) {
        router.push("/onboarding/");
      } else {
        router.push("/dashboard/");
      }
    } else {"""

content = content.replace(old_email, new_email)

with open(f, "w") as file:
    file.write(content)

print("AuthModal redirect fixed.")

import re

f = "frontend/src/components/Navbar.tsx"
with open(f, "r") as file:
    content = file.read()

old_hook = """  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);"""

new_hook = """  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-redirect logged-in users away from the marketing landing page
  useEffect(() => {
    if (user && window.location.pathname === "/") {
      window.location.href = "/dashboard/";
    }
  }, [user]);"""

content = content.replace(old_hook, new_hook)

with open(f, "w") as file:
    file.write(content)

print("Navbar.tsx auto-redirect added.")

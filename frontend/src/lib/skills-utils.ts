/**
 * Safe skill parsing and normalization utilities.
 * Handles strings, arrays, skill group objects ({ label, items }),
 * and skill item objects ({ name, skill }) without runtime exceptions.
 */

export function extractSkillStrings(rawSkills: unknown): string[] {
  if (!rawSkills) return [];
  const results: string[] = [];

  if (typeof rawSkills === "string") {
    rawSkills.split(/[,;\n]+/).forEach((s) => {
      const trimmed = s.trim();
      if (trimmed) results.push(trimmed);
    });
    return Array.from(new Set(results));
  }

  if (Array.isArray(rawSkills)) {
    for (const item of rawSkills) {
      if (typeof item === "string") {
        item.split(/[,;\n]+/).forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) results.push(trimmed);
        });
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (typeof obj.items === "string") {
          obj.items.split(/[,;\n]+/).forEach((s) => {
            const trimmed = s.trim();
            if (trimmed) results.push(trimmed);
          });
        }
        if (Array.isArray(obj.skills)) {
          for (const s of obj.skills) {
            if (typeof s === "string" && s.trim()) results.push(s.trim());
          }
        }
        if (typeof obj.name === "string" && obj.name.trim()) {
          results.push(obj.name.trim());
        }
        if (typeof obj.skill === "string" && obj.skill.trim()) {
          results.push(obj.skill.trim());
        }
        if (typeof obj.label === "string" && !obj.items && obj.label.trim()) {
          results.push(obj.label.trim());
        }
      }
    }
  }

  return Array.from(new Set(results.filter((s) => typeof s === "string" && s.length > 0)));
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  city?: string | null;
  platform?: string | null;
  url: string;
  workplace_type?: string | null;
  employment_type?: string | null;
  stipend_or_salary?: string | null;
  description?: string | null;
  skills?: string[];
  requirements?: string[];
  matched_skills?: string[];
  missing_skills?: string[];
  fit_score?: number | null;
  date_posted?: string | null;
  scraped_at?: string | null;
}

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  experience_years?: number;
  skills?: string[];
  primary_role?: string;
  preferred_locations?: string[];
  workplace_type?: string;
}

export interface UserPreferences {
  roles?: string[];
  locations?: string[];
  workplace_type?: string[];
  min_salary?: number;
}

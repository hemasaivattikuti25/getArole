export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string; // "Remote", "On-site", "Hybrid"
  salary_range?: string;
  description: string;
  posted_at: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  match_score?: number;
  match_details?: {
    strengths: string[];
    missing: string[];
  };
  tags: string[];
}

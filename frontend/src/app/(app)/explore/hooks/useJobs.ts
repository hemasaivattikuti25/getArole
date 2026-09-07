import { useState, useEffect } from 'react';
import { Job } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { extractSkillStrings } from '@/lib/skills-utils';

interface UseJobsOptions {
  locations?: string[];
  roles?: string[];
  experience?: string[];
  workplaceType?: string[];
}

const SUPABASE_REST_URL = "https://tgmhtlqcjgcjedlnthfk.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn";

function sanitizeJob(j: unknown): Job {
  const job = (j && typeof j === 'object' ? j : {}) as Record<string, unknown>;
  const rawDesc = typeof job.description === 'string' ? job.description.trim() : '';
  const skills = extractSkillStrings(job.skills);
  const title = String(job.title || 'Software Engineer');
  const company = String(job.company || 'Direct Employer');

  return {
    id: String(job.id || `job-${Math.random().toString(36).slice(2, 9)}`),
    title,
    company,
    location: typeof job.location === 'string' ? job.location : (typeof job.city === 'string' ? job.city : 'Remote'),
    city: typeof job.city === 'string' ? job.city : (typeof job.location === 'string' ? job.location : 'Remote'),
    platform: typeof job.platform === 'string' ? job.platform : 'Direct',
    url: typeof job.url === 'string' ? job.url : 'https://getarole.in/explore',
    workplace_type: typeof job.workplace_type === 'string' ? job.workplace_type : 'Hybrid',
    employment_type: typeof job.employment_type === 'string' ? job.employment_type : 'Full-time',
    stipend_or_salary: typeof job.stipend_or_salary === 'string' ? job.stipend_or_salary : null,
    description: rawDesc,
    skills,
    fit_score: typeof job.fit_score === 'number' ? job.fit_score : null,
    date_posted: typeof job.created_at === 'string' ? job.created_at : null,
    scraped_at: typeof job.created_at === 'string' ? job.created_at : null,
  };
}

export function useJobs(options: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchJobs() {
      try {
        setLoading(true);
        setError(null);
        let rawJobsList: unknown[] = [];

        // 1. First attempt: Hit local/proxied FastAPI backend (/api/jobs)
        try {
          const res = await apiClient.get('/jobs');
          const responseData = res as { jobs?: unknown[]; data?: unknown[] } | null | undefined;
          if (Array.isArray(res)) {
            rawJobsList = res;
          } else if (responseData?.jobs && Array.isArray(responseData.jobs)) {
            rawJobsList = responseData.jobs;
          } else if (responseData?.data && Array.isArray(responseData.data)) {
            rawJobsList = responseData.data;
          }
        } catch {
          // 2. Second attempt: Direct Supabase Cloud REST query (always works on GitHub Pages)
          try {
            const supaUrl = `${SUPABASE_REST_URL}/jobs?select=id,title,company,location,city,platform,url,workplace_type,employment_type,stipend_or_salary,description,skills,created_at&order=created_at.desc&limit=150`;
            const supaRes = await fetch(supaUrl, {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            });
            if (supaRes.ok) {
              const supaData = await supaRes.json();
              if (Array.isArray(supaData) && supaData.length > 0) {
                rawJobsList = supaData;
              }
            }
          } catch {
            // Supabase network error
          }
        }

        if (isMounted) {
          const sanitized = rawJobsList.map(sanitizeJob);
          let filtered = sanitized;

          if (options.locations?.length) {
            filtered = filtered.filter((j) =>
              options.locations!.some((loc) => {
                const l = loc.toLowerCase();
                return (
                  (j.location || '').toLowerCase().includes(l) ||
                  (j.city || '').toLowerCase().includes(l)
                );
              })
            );
          }

          if (options.roles?.length) {
            filtered = filtered.filter((j) =>
              options.roles!.some((role) => {
                const r = role.toLowerCase();
                const titleMatch = (j.title || '').toLowerCase().includes(r);
                const skillsMatch = (j.skills || []).some((s) =>
                  typeof s === 'string' && s.toLowerCase().includes(r)
                );
                return titleMatch || skillsMatch;
              })
            );
          }

          if (options.workplaceType?.length) {
            filtered = filtered.filter((j) =>
              options.workplaceType!.some((wp) =>
                (j.workplace_type || '').toLowerCase().includes(wp.toLowerCase())
              )
            );
          }

          setJobs(filtered);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [options.locations, options.roles, options.experience, options.workplaceType]);

  return { jobs, loading, error };
}

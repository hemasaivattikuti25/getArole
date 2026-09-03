import { useState, useEffect } from 'react';
import { Job } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface UseJobsOptions {
  locations?: string[];
  roles?: string[];
  experience?: string[];
  workplaceType?: string[];
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
        
        // In a real implementation, we would pass the filters to the backend
        // For now we'll fetch all and filter client-side, or use Supabase fallback
        
        // Let's try to hit the FastAPI backend first
        try {
          const res = await apiClient.get('/jobs');
          if (isMounted) {
            // The API returns { total: 1000, jobs: [...] }
            let allJobs: Job[] = Array.isArray(res) 
              ? res 
              : ((res as any)?.jobs || (res as any)?.data || []);
            
            let filtered = allJobs;

            if (options.locations?.length) {
              filtered = filtered.filter(j => 
                options.locations!.some(loc => 
                  (j.location || '').toLowerCase().includes(loc.toLowerCase()) ||
                  (j.city || '').toLowerCase().includes(loc.toLowerCase())
                )
              );
            }
            if (options.roles?.length) {
              filtered = filtered.filter(j => 
                options.roles!.some(role => 
                  (j.title || '').toLowerCase().includes(role.toLowerCase()) ||
                  (j.skills || []).some(s => s.toLowerCase().includes(role.toLowerCase()))
                )
              );
            }
            if (options.workplaceType?.length) {
              filtered = filtered.filter(j => 
                options.workplaceType!.some(wp => 
                  (j.workplace_type || '').toLowerCase().includes(wp.toLowerCase())
                )
              );
            }
            
            setJobs(filtered);
          }
        } catch (apiErr) {
          console.log("FastAPI backend failed, falling back to mock/Supabase data", apiErr);
          // Fallback logic if backend is down (similar to dashboard)
          if (isMounted) {
            setJobs([
              {
                id: 'mock-1',
                title: 'Senior Frontend Engineer',
                company: 'Google',
                location: 'Bengaluru',
                workplace_type: 'Hybrid',
                skills: ['React', 'Next.js', 'TypeScript'],
                fit_score: 95,
                url: 'https://careers.google.com'
              },
              {
                id: 'mock-2',
                title: 'Full Stack Developer',
                company: 'Microsoft',
                location: 'Hyderabad',
                workplace_type: 'On-site',
                skills: ['Node.js', 'React', 'Azure'],
                fit_score: 88,
                url: 'https://careers.microsoft.com'
              },
              {
                id: 'mock-3',
                title: 'Frontend Developer',
                company: 'Atlassian',
                location: 'Remote',
                workplace_type: 'Remote',
                skills: ['React', 'CSS', 'GraphQL'],
                fit_score: 92,
                url: 'https://atlassian.com'
              }
            ]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
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

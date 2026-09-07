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

const MOCK_JOBS: Job[] = [
  {
    id: 'mock-1',
    title: 'Senior Frontend Engineer',
    company: 'Google',
    location: 'Bengaluru',
    city: 'Bengaluru',
    workplace_type: 'Hybrid',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    fit_score: 95,
    url: 'https://careers.google.com',
    description: `Google is seeking a Senior Frontend Engineer to build the next generation of scalable, accessible web applications. You will partner with designers, backend architects, and product leads to deliver ultra-fast, delightful user interfaces serving millions of global users.

Key Responsibilities:
• Architect resilient, high-performance UI systems using React, TypeScript, and modern web frameworks.
• Optimize client-side rendering, Core Web Vitals, and asset delivery pipelines for speed and efficiency.
• Champion accessibility (WCAG), internationalization, and end-to-end testing standards.
• Mentor junior engineers and conduct rigorous code reviews to maintain world-class engineering quality.

Minimum Qualifications:
• 4+ years of professional software engineering experience specializing in frontend web development.
• Deep expertise in React.js, modern JavaScript/TypeScript, CSS architectures, and browser performance.
• Strong foundation in data structures, algorithms, and modular software design.`
  },
  {
    id: 'mock-2',
    title: 'Full Stack Developer',
    company: 'Microsoft',
    location: 'Hyderabad',
    city: 'Hyderabad',
    workplace_type: 'On-site',
    skills: ['Node.js', 'React', 'Azure', 'TypeScript', 'PostgreSQL'],
    fit_score: 88,
    url: 'https://careers.microsoft.com',
    description: `Microsoft is hiring a Full Stack Developer to build cloud-native enterprise services and developer tooling on Azure. You will design, develop, and maintain both backend microservices and intuitive web frontends.

Key Responsibilities:
• Build scalable REST and GraphQL APIs backed by Node.js, TypeScript, and distributed relational databases.
• Create clean, responsive frontend web views using React and contemporary design systems.
• Implement robust CI/CD pipelines, containerized deployments with Docker, and cloud monitoring on Azure.
• Diagnose production performance bottlenecks and ensure 99.99% system availability.

Minimum Qualifications:
• 3+ years of full-stack software development experience.
• Hands-on experience with Node.js/TypeScript, React, and relational database systems like PostgreSQL.
• Familiarity with cloud platforms (Azure, AWS, or GCP) and microservices architecture.`
  },
  {
    id: 'mock-3',
    title: 'Frontend Developer',
    company: 'Atlassian',
    location: 'Remote',
    city: 'Remote',
    workplace_type: 'Remote',
    skills: ['React', 'CSS', 'GraphQL', 'JavaScript'],
    fit_score: 92,
    url: 'https://atlassian.com',
    description: `Atlassian is looking for a Frontend Developer to join our distributed global team. You will build collaborative project management experiences used by thousands of engineering teams worldwide.

Key Responsibilities:
• Develop responsive, modular UI components in React and modern CSS for Jira and Confluence.
• Integrate frontend clients with GraphQL APIs for real-time data sync and state caching.
• Collaborate asynchronously across cross-functional engineering teams in a fully remote environment.
• Participate in design sprints, user testing sessions, and iterative product releases.

Minimum Qualifications:
• 2+ years of experience developing modern single-page applications.
• Strong proficiency in React, TypeScript/JavaScript, HTML5, and CSS-in-JS or Tailwind.
• Experience consuming GraphQL or RESTful web services.`
  },
  {
    id: 'mock-4',
    title: 'Backend Systems Engineer',
    company: 'Razorpay',
    location: 'Bengaluru',
    city: 'Bengaluru',
    workplace_type: 'Hybrid',
    skills: ['Go', 'FastAPI', 'Python', 'Docker', 'PostgreSQL'],
    fit_score: 91,
    url: 'https://razorpay.com/jobs',
    description: `Razorpay is seeking a Backend Systems Engineer to power India's fastest-growing fintech payment infrastructure. You will engineer mission-critical, low-latency financial transaction pipelines handling millions of requests daily.

Key Responsibilities:
• Design and maintain fault-tolerant backend services written in Go and Python/FastAPI.
• Architect low-latency database queries, connection pooling, and caching with PostgreSQL and Redis.
• Guarantee data consistency, transaction idempotency, and enterprise-grade security compliance.
• Automate deployments using Docker, Kubernetes, and automated integration test suites.

Minimum Qualifications:
• 3+ years of backend systems engineering experience.
• Strong proficiency in Go, Python, or Java with deep understanding of concurrency and network protocols.
• Experience building distributed transaction systems and database optimization.`
  }
];

function sanitizeJob(j: unknown): Job {
  if (!j || typeof j !== 'object') {
    return MOCK_JOBS[0];
  }
  const job = j as Record<string, unknown>;
  const rawDesc = typeof job.description === 'string' ? job.description.trim() : '';
  const skills = extractSkillStrings(job.skills);
  const title = String(job.title || 'Software Engineer');
  const company = String(job.company || 'Tech Company');

  const fallbackDesc = `We are seeking a talented ${title} to join ${company}. In this role, you will design, develop, and maintain high-performance software applications and distributed systems.\n\nKey Responsibilities:\n• Collaborate with cross-functional product, design, and engineering teams to build scalable solutions.\n• Write clean, testable, and maintainable code adhering to industry best practices.\n• Optimize application performance, reliability, and security across the entire stack.\n\nRequired Skills & Competencies:\n• Hands-on expertise in ${skills.length > 0 ? skills.join(', ') : 'modern software development principles, system architecture, and debugging'}.\n• Experience with version control, automated testing, and cloud environments.\n• Strong analytical and problem-solving abilities with collaborative communication skills.`;

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
    description: rawDesc || fallbackDesc,
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
            // Supabase network error; fall through to mock data
          }
        }

        // 3. Fallback: If both fail, use default curated mock jobs
        if (rawJobsList.length === 0) {
          rawJobsList = MOCK_JOBS;
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
          setJobs(MOCK_JOBS);
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

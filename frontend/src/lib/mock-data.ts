import { JobListing } from './types';

export const mockSavedJobs: JobListing[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    location: 'Remote',
    type: 'Remote',
    salary_range: '$140k - $180k',
    posted_at: '2 days ago',
    status: 'saved',
    match_score: 92,
    match_details: {
      strengths: ['Next.js', 'React', 'TypeScript', 'Performance Optimization'],
      missing: ['Go', 'Rust'],
    },
    tags: ['Next.js', 'Turbopack', 'Frontend'],
    description: `
We are looking for a Senior Frontend Engineer to help us build the future of the web.

### What you'll do
- Build and maintain core features of the Vercel dashboard
- Work closely with design to implement beautiful, accessible interfaces
- Optimize Web Vitals and ensure blazing fast performance

### Requirements
- 5+ years of experience with React
- Deep understanding of modern web performance
- Passion for developer experience and DX tooling
    `
  },
  {
    id: 'job-2',
    title: 'Full Stack Software Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    type: 'Hybrid',
    salary_range: '$150k - $210k',
    posted_at: '5 days ago',
    status: 'applied',
    match_score: 84,
    match_details: {
      strengths: ['React', 'API Design', 'System Architecture'],
      missing: ['Ruby', 'Financial Systems'],
    },
    tags: ['React', 'Node.js', 'Ruby'],
    description: `
Stripe is building the economic infrastructure for the internet.

### Responsibilities
- Design and build robust APIs
- Collaborate with product managers and designers
- Improve the reliability of our core payment flow

### Who you are
- Strong product sense and product-minded engineering
- Comfortable writing high-quality code in Ruby or JavaScript
    `
  },
  {
    id: 'job-3',
    title: 'AI Platform Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    type: 'On-site',
    posted_at: '1 week ago',
    status: 'interviewing',
    match_score: 75,
    match_details: {
      strengths: ['Python', 'System Architecture', 'API Design'],
      missing: ['PyTorch', 'CUDA', 'Model Inference Optimization'],
    },
    tags: ['Python', 'AI', 'Infrastructure'],
    description: `
Anthropic is an AI safety and research company.

### The Role
- Build the infrastructure that serves our large language models
- Optimize latency and throughput for millions of daily requests
- Design safe and secure API boundaries

### Requirements
- Strong distributed systems experience
- Proficiency in Python and Systems programming
    `
  }
];

/**
 * ==============================================================================
 * getArole AI — Google SRE Production Load Testing Suite (k6)
 * ==============================================================================
 * 
 * Execution Commands:
 * 1. Baseline Test (100 users):     k6 run -e SCENARIO=baseline tests/load/k6_load_test.js
 * 2. Heavy Read (1,000 search):    k6 run -e SCENARIO=heavy_read tests/load/k6_load_test.js
 * 3. Heavy Write (500 forms):      k6 run -e SCENARIO=heavy_write tests/load/k6_load_test.js
 * 4. API Throughput (10k req/min): k6 run -e SCENARIO=api_throughput tests/load/k6_load_test.js
 * 5. Gradual Ramp (0-1k in 10m):   k6 run -e SCENARIO=ramp_up tests/load/k6_load_test.js
 * 6. Flash Spike (5k in 30s):      k6 run -e SCENARIO=flash_spike tests/load/k6_load_test.js
 * 7. Soak Test (500 users for 24h):k6 run -e SCENARIO=soak_test tests/load/k6_load_test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// SRE SLI Metric Trends
const ErrorRate = new Rate('sre_error_rate');
const SearchLatency = new Trend('search_latency_ms');
const FormWriteLatency = new Trend('form_write_latency_ms');
const HomepageLatency = new Trend('homepage_latency_ms');

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8000';
const SELECTED_SCENARIO = __ENV.SCENARIO || 'baseline';

export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], // Global P95 < 500ms, P99 < 1.2s
    'sre_error_rate': ['rate<0.01'],                  // 99.9% Availability (Error rate < 1%)
    'search_latency_ms': ['p(95)<350'],               // Search P95 < 350ms
    'form_write_latency_ms': ['p(95)<600'],           // DB Write P95 < 600ms
  },
  scenarios: {
    // 1. Baseline Test (100 concurrent users on homepage)
    baseline: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      tags: { test_type: 'baseline' },
      exec: 'testHomepage',
    },
    // 2. Heavy Read (1,000 concurrent users on search)
    heavy_read: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '1m', target: 500 },
        { duration: '5m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'heavy_read' },
      exec: 'testJobSearch',
    },
    // 3. Heavy Write (500 concurrent users submitting forms)
    heavy_write: {
      executor: 'constant-vus',
      vus: 500,
      duration: '5m',
      tags: { test_type: 'heavy_write' },
      exec: 'testFormSubmissions',
    },
    // 4. Main API Throughput (10,000 requests/minute = ~167 RPS)
    api_throughput: {
      executor: 'constant-arrival-rate',
      rate: 167,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      tags: { test_type: 'api_throughput' },
      exec: 'testJobsAPI',
    },
    // 5. Gradual Ramp (0 to 1,000 users over 10 minutes)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 1000 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'ramp_up' },
      exec: 'testUserJourney',
    },
    // 6. Flash Spike (0 to 5,000 users in 30 seconds)
    flash_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5000 },
        { duration: '1m', target: 5000 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'flash_spike' },
      exec: 'testUserJourney',
    },
    // 7. Soak Test (500 users for 24 hours - memory leak detection)
    soak_test: {
      executor: 'constant-vus',
      vus: 500,
      duration: '24h',
      tags: { test_type: 'soak_test' },
      exec: 'testUserJourney',
    },
  },
};

// Filter scenarios based on environment variable if specified
if (SELECTED_SCENARIO && options.scenarios[SELECTED_SCENARIO]) {
  options.scenarios = { [SELECTED_SCENARIO]: options.scenarios[SELECTED_SCENARIO] };
}

// ── Test Handlers ─────────────────────────────────────────────────────────────

export function testHomepage() {
  group('1. Homepage Static & Edge Delivery', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: { 'Accept': 'text/html', 'User-Agent': 'k6-load-tester' }
    });
    HomepageLatency.add(res.timings.duration);
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'has security headers': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
    });
    ErrorRate.add(!success);
    sleep(1);
  });
}

export function testJobSearch() {
  group('2. Heavy Read Job Search & Filters', () => {
    const queries = ['python', 'react', 'software', 'machine learning', 'frontend', 'backend', 'data'];
    const locations = ['Bengaluru', 'Remote', 'Hyderabad', 'Chennai', 'Mumbai'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

    const res = http.get(`${BASE_URL}/api/jobs?query=${randomQuery}&location=${randomLoc}&limit=20`, {
      headers: { 'Accept': 'application/json' }
    });
    SearchLatency.add(res.timings.duration);
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'content is valid json array': (r) => Array.isArray(JSON.parse(r.body)),
    });
    ErrorRate.add(!success);
    sleep(0.5);
  });
}

export function testFormSubmissions() {
  group('3. Heavy Write Profile & Preferences Forms', () => {
    const fakeUid = `k6_user_${__VU}_${__ITER}`;
    const payload = JSON.stringify({
      first: 'Load',
      last: 'Tester',
      headline: 'Senior SRE Performance Engineer',
      skills: ['Python', 'k6', 'Distributed Systems', 'Kubernetes'],
      experience: [{ title: 'Staff Engineer', company: 'Google', duration: '3 years' }]
    });

    const res = http.post(`${BASE_URL}/api/user/profile`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fakeUid}`,
      }
    });
    FormWriteLatency.add(res.timings.duration);
    const success = check(res, {
      'profile write status 200': (r) => r.status === 200,
    });
    ErrorRate.add(!success);
    sleep(1);
  });
}

export function testJobsAPI() {
  const res = http.get(`${BASE_URL}/api/jobs?limit=50`);
  const success = check(res, { 'status is 200': (r) => r.status === 200 });
  ErrorRate.add(!success);
}

export function testUserJourney() {
  // Realistic end-to-end user navigation flow
  testHomepage();
  testJobSearch();
  testFormSubmissions();
}

/**
 * Load Testing Script for k6
 * Tests application performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.1'],              // Custom error rate
    api_response_time: ['p(95)<300'], // 95% of API calls should be below 300ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';

export default function () {
  // Test home page
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test API endpoints
  response = http.get(`${BASE_URL}/api/children`);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'API status is 200': (r) => r.status === 200,
    'API response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test service worker
  response = http.get(`${BASE_URL}/sw.js`);
  check(response, {
    'SW status is 200': (r) => r.status === 200,
    'SW is JavaScript': (r) => r.headers['Content-Type'].includes('javascript'),
  }) || errorRate.add(1);

  sleep(1);

  // Test manifest
  response = http.get(`${BASE_URL}/manifest.json`);
  check(response, {
    'Manifest status is 200': (r) => r.status === 200,
    'Manifest is valid JSON': (r) => {
      try {
        const manifest = JSON.parse(r.body);
        return manifest.name && manifest.short_name;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(2);
}

// Setup function
export function setup() {
  console.log('Starting load test...');
  console.log(`Target URL: ${BASE_URL}`);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}

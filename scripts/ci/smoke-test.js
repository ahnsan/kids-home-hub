#!/usr/bin/env node

/**
 * Smoke Tests for Kids Home Hub
 * Basic health checks after deployment
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : 'http://localhost:8787';

console.log(`Running smoke tests against: ${baseUrl}`);

// Test suite
const tests = [
  {
    name: 'Health Check',
    path: '/health',
    expectedStatus: 200,
    validate: (body) => {
      const data = JSON.parse(body);
      return data.status === 'ok';
    }
  },
  {
    name: 'Service Worker',
    path: '/sw.js',
    expectedStatus: 200,
    validate: (body) => body.includes('self.addEventListener')
  },
  {
    name: 'Main Application',
    path: '/',
    expectedStatus: 200,
    validate: (body) => body.includes('Kids Home Hub')
  },
  {
    name: 'API Endpoint - Children',
    path: '/api/children',
    expectedStatus: 200,
    validate: (body) => {
      try {
        const data = JSON.parse(body);
        return Array.isArray(data) || typeof data === 'object';
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Static Assets',
    path: '/manifest.json',
    expectedStatus: 200,
    validate: (body) => {
      try {
        const manifest = JSON.parse(body);
        return manifest.name && manifest.short_name;
      } catch {
        return false;
      }
    }
  }
];

// HTTP request helper
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
          headers: res.headers
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Run tests
async function runTests() {
  console.log('\n=== Starting Smoke Tests ===\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    const url = `${baseUrl}${test.path}`;
    console.log(`Testing: ${test.name}...`);

    try {
      const response = await makeRequest(url);

      // Check status code
      if (response.statusCode !== test.expectedStatus) {
        console.error(`  FAILED: Expected status ${test.expectedStatus}, got ${response.statusCode}`);
        failed++;
        results.push({
          name: test.name,
          status: 'FAILED',
          reason: `Status code mismatch: ${response.statusCode}`
        });
        continue;
      }

      // Validate response
      if (test.validate && !test.validate(response.body)) {
        console.error(`  FAILED: Response validation failed`);
        failed++;
        results.push({
          name: test.name,
          status: 'FAILED',
          reason: 'Response validation failed'
        });
        continue;
      }

      console.log(`  PASSED`);
      passed++;
      results.push({
        name: test.name,
        status: 'PASSED'
      });

    } catch (error) {
      console.error(`  FAILED: ${error.message}`);
      failed++;
      results.push({
        name: test.name,
        status: 'FAILED',
        reason: error.message
      });
    }
  }

  console.log('\n=== Test Results ===\n');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${tests.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`  - ${r.name}: ${r.reason}`);
    });
    process.exit(1);
  }

  console.log('\nAll smoke tests passed!');
  process.exit(0);
}

// Run with timeout
const timeout = setTimeout(() => {
  console.error('Smoke tests timed out after 60 seconds');
  process.exit(1);
}, 60000);

runTests().finally(() => {
  clearTimeout(timeout);
});

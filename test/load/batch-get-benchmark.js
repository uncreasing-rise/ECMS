const fs = require('node:fs');
const path = require('node:path');
const autocannon = require('autocannon');

const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:3000/api/v1';
const loginUrl = `${baseUrl}/auth/login`;
const durationSeconds = Number(process.env.LOAD_DURATION_SECONDS || '10');
const connections = Number(process.env.LOAD_CONNECTIONS || '100');
const label = process.env.LOAD_LABEL || 'run';

const email = process.env.LOAD_EMAIL || 'admin@ecms.local';
const password = process.env.LOAD_PASSWORD || 'admin123';

const endpoints = [
  '/users?page=1&limit=20',
  '/roles?page=1&limit=20',
  '/courses?page=1&limit=20',
  '/classes?page=1&limit=20',
];

async function login() {
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.access_token) {
    throw new Error('Login response missing access_token');
  }

  return json.access_token;
}

function runEndpoint(url, token) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url,
      method: 'GET',
      connections,
      duration: durationSeconds,
      timeout: 15,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    instance.on('done', (result) => resolve(result));
  });
}

function summarize(endpoint, result) {
  const totalResponses =
    (result['1xx'] || 0) +
    (result['2xx'] || 0) +
    (result['3xx'] || 0) +
    (result['4xx'] || 0) +
    (result['5xx'] || 0);
  const httpErrors = (result['4xx'] || 0) + (result['5xx'] || 0);
  const errors = result.errors || 0;
  const totalAttempts = totalResponses + errors;

  return {
    endpoint,
    avgRps: result.requests?.average || 0,
    p95Ms: result.latency?.p97_5 || result.latency?.p95 || result.latency?.average || 0,
    errorRate: totalAttempts > 0 ? (httpErrors + errors) / totalAttempts : 1,
    status2xx: result['2xx'] || 0,
    status4xx: result['4xx'] || 0,
    status5xx: result['5xx'] || 0,
    errors,
    timeouts: result.timeouts || 0,
  };
}

async function main() {
  const token = await login();
  const results = [];

  for (const endpoint of endpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
    const raw = await runEndpoint(fullUrl, token);
    results.push(summarize(endpoint, raw));
  }

  const report = {
    label,
    baseUrl,
    durationSeconds,
    connections,
    timestamp: new Date().toISOString(),
    results,
  };

  const reportsDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const file = path.join(
    reportsDir,
    `batch-get-${label}-${report.timestamp.replace(/[:.]/g, '-')}.json`,
  );
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  console.log(`Report: ${file}`);
  for (const item of results) {
    console.log(
      `${item.endpoint} | rps=${item.avgRps.toFixed(2)} | p95=${item.p95Ms.toFixed(2)}ms | err=${(item.errorRate * 100).toFixed(2)}%`,
    );
  }
}

main().catch((error) => {
  console.error('Batch benchmark failed:', error);
  process.exitCode = 1;
});

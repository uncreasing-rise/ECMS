const autocannon = require('autocannon');

const url = process.env.LOAD_URL || 'http://localhost:3000/api/v1/auth/login';
const connections = Number(process.env.LOAD_CONNECTIONS || '200');
const duration = Number(process.env.LOAD_DURATION_SECONDS || '30');

const instance = autocannon({
  url,
  method: 'POST',
  connections,
  duration,
  timeout: 10,
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    email: process.env.LOAD_EMAIL || 'load-test@example.com',
    password: process.env.LOAD_PASSWORD || 'invalid-password',
  }),
});

autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: true,
  renderLatencyTable: true,
});

instance.on('done', (result) => {
  const p95 = result.latency && result.latency.p95 ? result.latency.p95 : 0;
  const rps = result.requests && result.requests.average ? result.requests.average : 0;
  const errors = result.errors || 0;
  console.log(`\nSummary: rps_avg=${rps}, latency_p95_ms=${p95}, errors=${errors}`);
  if (errors > 0) {
    process.exitCode = 1;
  }
});

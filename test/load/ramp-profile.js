const autocannon = require('autocannon');
const fs = require('node:fs');
const path = require('node:path');

const baseUrl = process.env.LOAD_URL || 'http://localhost:3000/api/v1/auth/login';
const durationSeconds = Number(process.env.LOAD_DURATION_SECONDS || '20');
const pipeline = Number(process.env.LOAD_PIPELINE || '1');
const phases = String(process.env.LOAD_PHASES || '1000,3000,5000,10000')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isFinite(item) && item > 0);

const thresholdMinRps = Number(process.env.LOAD_PASS_MIN_RPS || '300');
const thresholdMaxP95Ms = Number(process.env.LOAD_PASS_MAX_P95_MS || '2500');
const thresholdMaxErrorRate = Number(process.env.LOAD_PASS_MAX_ERROR_RATE || '0.02');

const requestBody = JSON.stringify({
  email: process.env.LOAD_EMAIL || 'load-test@example.com',
  password: process.env.LOAD_PASSWORD || 'invalid-password',
});

function runPhase(connections) {
  return new Promise((resolve) => {
    const instance = autocannon({
      url: baseUrl,
      method: 'POST',
      connections,
      duration: durationSeconds,
      timeout: 15,
      pipelining: pipeline,
      headers: {
        'content-type': 'application/json',
      },
      body: requestBody,
    });

    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
      renderLatencyTable: true,
    });

    instance.on('done', (result) => resolve(result));
  });
}

function toPhaseSummary(connections, result) {
  const avgRps = result.requests?.average || 0;
  const p95 =
    result.latency?.p95 ??
    result.latency?.p97_5 ??
    result.latency?.p99 ??
    result.latency?.average ??
    0;
  const totalResponses =
    (result['1xx'] || 0) +
    (result['2xx'] || 0) +
    (result['3xx'] || 0) +
    (result['4xx'] || 0) +
    (result['5xx'] || 0);
  const httpErrors = (result['4xx'] || 0) + (result['5xx'] || 0);
  const errors = result.errors || 0;
  const timeouts = result.timeouts || 0;
  const totalAttempts = totalResponses + errors;
  const errorCount = httpErrors + errors;
  const errorRate = totalAttempts > 0 ? errorCount / totalAttempts : 1;

  const checks = {
    rps: avgRps >= thresholdMinRps,
    p95: p95 <= thresholdMaxP95Ms,
    errorRate: errorRate <= thresholdMaxErrorRate,
  };

  return {
    connections,
    avgRps,
    p95,
    errors,
    timeouts,
    status2xx: result['2xx'] || 0,
    status4xx: result['4xx'] || 0,
    status5xx: result['5xx'] || 0,
    errorRate,
    checks,
    passed: checks.rps && checks.p95 && checks.errorRate,
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function generateMarkdown(report) {
  const lines = [];
  lines.push('# Load Test Report');
  lines.push('');
  lines.push(`- Timestamp: ${report.timestamp}`);
  lines.push(`- Target: ${report.target}`);
  lines.push(`- Duration per phase: ${report.durationSeconds}s`);
  lines.push(`- Phases: ${report.phases.join(', ')}`);
  lines.push('');
  lines.push('## Thresholds');
  lines.push('');
  lines.push(`- Min RPS: ${report.thresholds.minRps}`);
  lines.push(`- Max p95 (ms): ${report.thresholds.maxP95Ms}`);
  lines.push(`- Max error rate: ${formatPercent(report.thresholds.maxErrorRate)}`);
  lines.push('');
  lines.push('## Phase Results');
  lines.push('');
  lines.push('| Connections | Avg RPS | p95 (ms) | Error Rate | 2xx | 4xx | 5xx | Errors | Timeouts | Pass |');
  lines.push('|---:|---:|---:|---:|---:|---:|---:|---:|---:|:---:|');

  for (const phase of report.results) {
    lines.push(
      `| ${phase.connections} | ${phase.avgRps.toFixed(2)} | ${phase.p95.toFixed(2)} | ${formatPercent(phase.errorRate)} | ${phase.status2xx} | ${phase.status4xx} | ${phase.status5xx} | ${phase.errors} | ${phase.timeouts} | ${phase.passed ? 'PASS' : 'FAIL'} |`,
    );
  }

  lines.push('');
  lines.push(`## Overall: ${report.overallPassed ? 'PASS' : 'FAIL'}`);
  return lines.join('\n');
}

async function main() {
  if (phases.length === 0) {
    throw new Error('No valid load phases. Set LOAD_PHASES, e.g. 1000,3000,5000,10000');
  }

  const results = [];

  for (const phaseConnections of phases) {
    console.log(`\n=== Phase ${phaseConnections} connections for ${durationSeconds}s ===`);
    const phaseResult = await runPhase(phaseConnections);
    results.push(toPhaseSummary(phaseConnections, phaseResult));
  }

  const overallPassed = results.every((item) => item.passed);
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    target: baseUrl,
    durationSeconds,
    phases,
    thresholds: {
      minRps: thresholdMinRps,
      maxP95Ms: thresholdMaxP95Ms,
      maxErrorRate: thresholdMaxErrorRate,
    },
    results,
    overallPassed,
  };

  const reportsDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const fileSuffix = timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDir, `ramp-report-${fileSuffix}.json`);
  const mdPath = path.join(reportsDir, `ramp-report-${fileSuffix}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, generateMarkdown(report));

  console.log(`\nReport JSON: ${jsonPath}`);
  console.log(`Report MD: ${mdPath}`);
  console.log(`Overall result: ${overallPassed ? 'PASS' : 'FAIL'}`);

  if (!overallPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Failed to run ramp profile:', error);
  process.exitCode = 1;
});

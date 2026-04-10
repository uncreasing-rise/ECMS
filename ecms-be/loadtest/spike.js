import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '30s', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ENDPOINT = __ENV.ENDPOINT || '/';

export default function () {
  const res = http.get(`${BASE_URL}${ENDPOINT}`);
  check(res, {
    'status is 2xx or 429': (r) =>
      (r.status >= 200 && r.status < 300) || r.status === 429,
  });

  sleep(0.2);
}

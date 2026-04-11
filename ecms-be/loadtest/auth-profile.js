import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        {
          duration: __ENV.RAMP_UP || '2m',
          target: Number(__ENV.PEAK_VUS || 200),
        },
        { duration: __ENV.HOLD || '5m', target: Number(__ENV.PEAK_VUS || 200) },
        { duration: __ENV.RAMP_DOWN || '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

function login() {
  const email = __ENV.LOGIN_EMAIL;
  const password = __ENV.LOGIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing LOGIN_EMAIL or LOGIN_PASSWORD env vars');
  }

  const payload = JSON.stringify({ email, password });
  const res = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'login status is 200': (r) => r.status === 200,
  });

  const data = res.json();
  const accessToken = data?.access_token;
  if (!accessToken) {
    throw new Error('Login succeeded but access_token is missing');
  }

  return accessToken;
}

export function setup() {
  if (__ENV.ACCESS_TOKEN) {
    return { token: __ENV.ACCESS_TOKEN };
  }

  return { token: login() };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });

  check(res, {
    'profile status is 200': (r) => r.status === 200,
  });

  sleep(Number(__ENV.SLEEP_SECONDS || 0.5));
}

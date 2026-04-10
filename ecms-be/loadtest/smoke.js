import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ENDPOINT = __ENV.ENDPOINT || '/';

export default function () {
  const res = http.get(`${BASE_URL}${ENDPOINT}`);
  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}

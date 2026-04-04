import cluster from 'node:cluster';
import os from 'node:os';
import { bootstrap } from './main';

async function startWorker() {
  await bootstrap();
}

function getWorkerCount(): number {
  const configured = Number(process.env.WEB_CONCURRENCY ?? '0');
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return Math.max(1, os.availableParallelism() - 1);
}

if (cluster.isPrimary) {
  const workerCount = getWorkerCount();

  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  startWorker();
}

module.exports = {
  apps: [
    {
      name: 'ecms-api',
      script: 'dist/main.js',
      instances: 'max', // Scale horizontally to all CPU cores
      exec_mode: 'cluster', // Enables Node.js load balancing
      watch: false, // Turn off watch in production for performance
      max_memory_restart: '2G', // Elevated graceful leak protection for 10k ws sockets
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_MAX_POOL_SIZE: 50, // Downscaled to 50 per worker due to cluster mode spanning 10k connections
      },
    },
    {
      name: 'ecms-worker',
      script: 'dist/notification-worker.js',
      instances: 1, // Keep background worker as standalone (no concurrency race condition unless handled by BullMQ)
      exec_mode: 'fork',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};

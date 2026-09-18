// PM2 Ecosystem Configuration — Cluster Mode
// Start:  pm2 start ecosystem.config.cjs --env production
// Stop:   pm2 stop furniva-api
// Reload: pm2 reload furniva-api  (zero-downtime)
// Logs:   pm2 logs furniva-api
// Monit:  pm2 monit

module.exports = {
  apps: [
    {
      name: "furniva-api",
      script: "server.js",
      cwd: __dirname,

      // ── Cluster Mode ──────────────────────────────────────────────
      instances: "max",       // One worker per CPU core
      exec_mode: "cluster",   // PM2 cluster (built-in load balancer)

      // ── Environment ───────────────────────────────────────────────
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // ── Process Management ────────────────────────────────────────
      watch: false,                      // Disable in production
      max_memory_restart: "500M",        // Auto-restart on memory leak
      restart_delay: 3000,               // 3s delay between crash restarts
      max_restarts: 10,                  // Max restart attempts
      min_uptime: "10s",                 // Min uptime before considered started

      // ── Logging ───────────────────────────────────────────────────
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,                  // Merge all cluster worker logs

      // ── Graceful Shutdown ─────────────────────────────────────────
      kill_timeout: 5000,                // 5s grace period for open connections
      listen_timeout: 10000,             // 10s max wait for app to listen
    },
  ],
};

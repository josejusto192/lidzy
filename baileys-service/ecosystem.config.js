/**
 * PM2 Configuration for Baileys Service
 * Deploy: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'lidzy-baileys',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
}

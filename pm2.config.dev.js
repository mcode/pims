/**
 * This file serves as configuration for the PM2 process manager.
 * For more info, see: http://pm2.keymetrics.io/docs/usage/application-declaration/
 *
 * This is mainly used in our Docker image.
 */
 module.exports = {
  apps: [
    // API Server
    {
      name: 'API',
      script: 'npm start',
      cwd: 'backend'
    },
    // Fronted Server
    {
      name: 'FrontEnd',
      script: 'npm start',
      cwd: 'frontend'
    }
  ]
};
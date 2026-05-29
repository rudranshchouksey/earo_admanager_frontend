module.exports = {
  apps: [
    {
      name: 'earo-app',
      script: 'npm',
      args: 'run preview', // Bind to 5001
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
    },
  ],
};

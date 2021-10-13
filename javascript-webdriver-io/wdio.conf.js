const config = {
  runner: 'local',
  headless: true,
  path: '/',
  specs: ['test/*.test.js'],
  exclude: [],
  maxInstances: 10,
  capabilities: [
    {
      maxInstances: 5,
      browserName: 'firefox'
    }
  ],
  logLevel: 'info',
  bail: 0,
  baseUrl: 'https://playground.mailslurp.com',
  waitforTimeout: 30000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  framework: 'mocha',
  services: ['geckodriver'],
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};

exports.config = config;

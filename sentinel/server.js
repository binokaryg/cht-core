const request = require('request');

const logger = require('@medic/logger');
const environment = require('@medic/environment');
const serverChecks = require('@medic/server-checks');

process
  .on('unhandledRejection', reason => {
    logger.error('Unhandled Rejection:');
    logger.error('%o', reason);
  })
  .on('uncaughtException', err => {
    logger.error('UNCAUGHT EXCEPTION!');
    logger.error('  Error: %o', err);
    process.exit(1);
  });

const waitForApi = () => new Promise(resolve => {
  // This waits forever, with no escape hatch, because there is no way currently
  // to know what API is doing, and migrations could legitimately take days
  const url = `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || 5988}/setup/poll`;
  const waitLoop = () => {
    request({ url, json: true }, (err, response, body) => {
      if (err) {
        logger.info('Waiting for API to be ready...');
        return setTimeout(() => waitLoop(), 10 * 1000);
      }

      logger.info(`API is ready: ${JSON.stringify(body)}`);
      resolve();
    });
  };

  waitLoop();
});

logger.info('Running server checks...');

(async () => {
  try {
    await serverChecks.check(environment.couchUrl);
    await waitForApi();

    const config = require('./src/config');
    await config.init();

    const schedule = require('./src/schedule');
    schedule.init();

    logger.info('startup complete.');

    const processHooks = require('./src/process-hooks');
    processHooks.init();

  } catch (err) {
    logger.error('Fatal error initialising sentinel');
    logger.error('%o', err);
    process.exit(1);
  }
})();

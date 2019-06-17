const log4js = require('log4js');
log4js.configure({
  appenders: { exceptions: { type: 'file', filename: 'errors.log' } },
  categories: { default: { appenders: ['exceptions'], level: 'error' } }
});
 
const logger = log4js.getLogger('exceptions');

module.exports = logger;
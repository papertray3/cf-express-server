"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("log4js");
const index_1 = require("../index");
const fs_1 = require("fs");
const options = {
    logLevel: {
        describe: 'log4js log level for default console appender. Use env:LOG4JS_CONFIG to point to a configuration file (https://www.npmjs.com/package/log4js). This option will be ignored if a configuration file is used',
        type: 'string',
        env: 'LOG_LEVEL',
        confDefault: 'info'
    }
};
var Log4jsConfigNames;
(function (Log4jsConfigNames) {
    Log4jsConfigNames["LOG_LEVEL"] = "logLevel";
})(Log4jsConfigNames = exports.Log4jsConfigNames || (exports.Log4jsConfigNames = {}));
exports.LOG4JS_ADDIN_NAME = 'log4jsAddIn';
exports.LOG4JS_ADDIN_PRIORITY = 100;
class Log4jsAddInImpl extends index_1.BasicAddIn {
    configure(options) {
        this._log4jsConfiguration = options;
    }
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        const config = server.getConfig();
        let defaultConfig = false;
        if (!process.env.LOG4JS_CONFIG || !fs_1.existsSync(process.env.LOG4JS_CONFIG) || !fs_1.lstatSync(process.env.LOG4JS_CONFIG).isFile()) {
            if (!this._log4jsConfiguration) {
                defaultConfig = true;
                this._log4jsConfiguration = {
                    appenders: { server: { type: 'console' } },
                    categories: {
                        default: {
                            appenders: ['server'],
                            level: config.get(Log4jsConfigNames.LOG_LEVEL)
                        }
                    }
                };
            }
            log4js_1.configure(this._log4jsConfiguration);
        }
        const log = server.getLogger(this.name);
        log.info('Logging using default configuration. Consider setting env.LOG4JS_CONFIG to a file');
        if (defaultConfig) {
            log.debug('Using default log4js configuration');
            log.debug(this._log4jsConfiguration);
        }
    }
}
exports.log4jsAddIn = new Log4jsAddInImpl(exports.LOG4JS_ADDIN_NAME, exports.LOG4JS_ADDIN_PRIORITY);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("log4js");
const fs_1 = require("fs");
let log4jsConfiguration;
exports.log4jsAddIn = {
    disabled: false,
    priority: 100,
    configure: (options) => {
        log4jsConfiguration = options;
    },
    getOptions: (currentOptions) => { return null; },
    addIn: (server) => {
        const config = server.getConfig();
        let defaultConfig = false;
        if (!process.env.LOG4JS_CONFIG || !fs_1.existsSync(process.env.LOG4JS_CONFIG) || !fs_1.lstatSync(process.env.LOG4JS_CONFIG).isFile()) {
            if (!log4jsConfiguration) {
                defaultConfig = true;
                log4jsConfiguration = {
                    appenders: { server: { type: 'console' } },
                    categories: {
                        default: {
                            appenders: ['server'],
                            level: config.get('logLevel')
                        }
                    }
                };
            }
            log4js_1.configure(log4jsConfiguration);
        }
        const log = server.getLogger('log4jsAddIn');
        log.info('Logging using default configuration. Consider setting env.LOG4JS_CONFIG to a file');
    }
};

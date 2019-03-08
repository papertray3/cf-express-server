import { configure as _log4jsConfigure, Configuration } from 'log4js';

import { AddIn, CliOptions, CFExpressServer } from '../index';
import { serverAddIn } from './create-server';
import { existsSync, lstatSync } from 'fs';

export interface Log4jsAddIn extends AddIn {
    configure(options: Configuration): void;
}

let log4jsConfiguration: Configuration;
export const log4jsAddIn: Log4jsAddIn = {
    disabled: false,
    priority: 100,
    configure: (options: Configuration): void => {
        log4jsConfiguration = options;
    },
    getOptions: (currentOptions: CliOptions) => { return null; },
    addIn: (server: CFExpressServer) => {
        const config = server.getConfig();
        let defaultConfig = false;

        if (!process.env.LOG4JS_CONFIG || !existsSync(process.env.LOG4JS_CONFIG) || !lstatSync(process.env.LOG4JS_CONFIG).isFile()) {
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
                }
            }
            _log4jsConfigure(log4jsConfiguration);
        }

        const log = server.getLogger('log4jsAddIn');
        log.info('Logging using default configuration. Consider setting env.LOG4JS_CONFIG to a file');

    }

}
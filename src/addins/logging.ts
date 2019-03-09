import { configure as _log4jsConfigure, Configuration } from 'log4js';

import { AddIn, CliOptions, CFExpressServer, BasicAddIn, CommonConfigNames } from '../index';
import { serverAddIn } from './create-server';
import { existsSync, lstatSync } from 'fs';

const options : CliOptions = {
    logLevel: {
        describe: 'log4js log level for default console appender. Use env:LOG4JS_CONFIG to point to a configuration file (https://www.npmjs.com/package/log4js). This option will be ignored if a configuration file is used',
        type: 'string',
        env: 'LOG_LEVEL',
        confDefault: 'info'
    }
}

export enum Log4jsConfigNames {
    LOG_LEVEL = 'logLevel'
}

export const LOG4JS_ADDIN_NAME = 'log4jsAddIn';
export const LOG4JS_ADDIN_PRIORITY = 100;

export interface Log4jsAddIn extends AddIn {
    configure(options: Configuration): void;
}

class Log4jsAddInImpl extends BasicAddIn implements Log4jsAddIn {

    protected _log4jsConfiguration: Configuration | undefined;

    configure(options: Configuration): void {
        this._log4jsConfiguration = options;
    }
    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }    
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        const config = server.getConfig();
        let defaultConfig = false;

        if (!process.env.LOG4JS_CONFIG || !existsSync(process.env.LOG4JS_CONFIG) || !lstatSync(process.env.LOG4JS_CONFIG).isFile()) {
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
                }
            }
            _log4jsConfigure(this._log4jsConfiguration);
        }

        const log = server.getLogger(this.name);
        log.info('Logging using default configuration. Consider setting env.LOG4JS_CONFIG to a file');

        if (defaultConfig) {
            log.debug('Using default log4js configuration');
            log.debug(this._log4jsConfiguration);
        }
    }


}


export const log4jsAddIn: Log4jsAddIn = new Log4jsAddInImpl(LOG4JS_ADDIN_NAME, LOG4JS_ADDIN_PRIORITY);
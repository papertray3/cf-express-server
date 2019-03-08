import { Server } from 'net';
import express, { Express } from 'express';
import { getLogger as _log4jsGetLogger, Logger } from 'log4js';
import nconf from 'nconf';
import { config } from 'dotenv';
import { resolve, normalize } from 'path';
import yargs from 'yargs';

import { serverAddIn } from './addins/create-server';
import { helmetAddIn } from './addins/helmet';
import { log4jsAddIn } from './addins/logging';
import { sessionAddIn } from './addins/sessions';
import { cloudantStoreAddIn } from './addins/cloudant-store';
import { appIdAddIn } from './addins/appid-webstrategy';

export { serverAddIn, helmetAddIn, log4jsAddIn, sessionAddIn, cloudantStoreAddIn, appIdAddIn };


export interface AddIn {
    disabled: boolean,
    priority: number, //builtin addins will start at 100
    getOptions(currentOptions: CliOptions): CliOptions | null;
    addIn(server: CFExpressServer): void;
}

let _addins: AddIn[] = [log4jsAddIn, helmetAddIn, cloudantStoreAddIn, sessionAddIn, appIdAddIn, serverAddIn];

const cfenv = require('cfenv');

// Add an optional env string to Yargs Options
// this allows a cli (e.g. --someOption) but also
// specify an env variable as a backup
export interface CliOption extends yargs.Options {
    env?: string | Array<string>,
    confDefault?: any
}

export interface CliOptions {
    [option: string]: CliOption
}

export interface ConfigOptions {
    version?: string,
    loggerName?: string,
    envPath?: string,
    usage?: string,
    cliOptions?: CliOptions,
    overrides?: ConfigDefaults
}

export const commonOptions: CliOptions = {
    env: {
        describe: 'Operational mode',
        choices: ['development', 'test', 'production'],
        type: 'string',
        env: 'NODE_ENV',
        confDefault: 'production'
    },
    port: {
        describe: 'Port to bind to',
        type: 'number',
        env: 'PORT'
    },
    bind: {
        describe: 'Host to bind to',
        type: 'string',
        env: 'BIND'
    },
    logLevel: {
        describe: 'log4js log level for default console appender. Use env:LOG4JS_CONFIG to point to a configuration file (https://www.npmjs.com/package/log4js). This option will be ignored if a configuration file is used',
        type: 'string',
        env: 'LOG_LEVEL',
        confDefault: 'info'
    }
}

type ConfigDefaults = {
    [key: string]: any
}

type NconfObject = {
    key: string,
    value: string
}

type BasicTransform = (obj: NconfObject) => NconfObject | boolean;

// basic transform
let bt = (newKey: string): BasicTransform => {
    return (obj: NconfObject): NconfObject => {
        return {
            key: newKey,
            value: obj.value
        };
    }
}

type Transforms = {
    [key: string]: BasicTransform
}

function configure(options: ConfigOptions): typeof nconf {

    let dotEnvPath = options.envPath;
    if (dotEnvPath) {
        config({ path: resolve(normalize(dotEnvPath)) });
    } else {
        config();
    }

    if (options.usage) yargs.usage(options.usage);
    if (options.version) yargs.version(options.version);
    let opts: CliOptions = options.cliOptions || commonOptions;
    let whitelist: Array<string> = [];
    let transforms: Transforms = {};
    let defaults: ConfigDefaults = {};

    Object.keys(opts).forEach((key: string) => {
        let opt = opts[key];
        if (opt.env) {
            opt.describe += ' (';
            let envs = Array.isArray(opt.env) ? opt.env : [opt.env];
            whitelist.push(key);
            envs.forEach((env: string, idx: number) => {
                transforms[env] = bt(key);
                if (idx > 0) {
                    opt.describe += ', ';
                }
                opt.describe += `env:${env}`;
            });

            opt.describe += ')';
        }

        if (opt.confDefault) {
            defaults[key] = opt.confDefault;
        }
    });

    yargs.options(opts);
    nconf
        .argv(yargs)
        .env({
            parseValues: true,
            whitelist: whitelist,
            transform: (obj: NconfObject): NconfObject | boolean => {
                if (transforms[obj.key]) {
                    return transforms[obj.key](obj);
                }

                return obj;
            }
        });

    nconf.defaults(defaults);

    let overrides = options.overrides || {};
    if (!overrides.isLocal) {
        overrides.isLocal = cfenv.getAppEnv().isLocal;
    }

    nconf.overrides(overrides);

    if (cfenv.getAppEnv().isLocal && !process.env.PORT) {
        if (nconf.get('port')) {
            process.env.PORT = nconf.get('port');
        }
    }

    nconf.add('cfenv', { type: 'literal', store: cfenv.getAppEnv() });
    return nconf;
}

export interface CFExpressServer extends Express {
    getConfig(): typeof nconf;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}


export function CreateCFServer(configuration?: ConfigOptions, addins?: AddIn[]): CFExpressServer {
    const app: CFExpressServer = express() as CFExpressServer;

    if (configuration && !configuration.cliOptions)
        configuration.cliOptions = commonOptions;

    let config: ConfigOptions = configuration ? configuration : {
        cliOptions: commonOptions
    }

    if (addins)
        _addins = _addins.concat(addins);

    _addins = _addins.filter((addIn: AddIn) => !addIn.disabled).sort((a, b) => {
        return a.priority - b.priority;
    });

    _addins.forEach((curAddin: AddIn) => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions as CliOptions));
    });

    app.getLogger = (name?: string) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return _log4jsGetLogger(lname);
    }

    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; }

    app.start = (listener?: Function) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get('port'), () => {
            log.info('Listening on port: ' + appConfig.get('port'));
            if (listener)
                listener();
        });
    }

    _addins.forEach((curAddin: AddIn) => {
        curAddin.addIn(app);
    });

    return app;
}
import { Server } from 'net';
import express, { Express } from 'express';
import { getLogger as _log4jsGetLogger, Logger } from 'log4js';
import nconf from 'nconf';
import { config } from 'dotenv';
import { resolve, normalize } from 'path';
import yargs from 'yargs';

export type Config = typeof nconf;

export interface AddIn {
    name: string,
    disabled: boolean,
    priority: number, //builtin addins will start at 100
    getOptions(currentOptions: CliOptions, addIns : AddIn[]): CliOptions | null;
    addIn(server: CFExpressServer, addIns : AddIn[]): void;
}

export abstract class BasicAddIn implements AddIn {
    private _name : string;
    private _disabled : boolean = false;
    private _priority : number;

    constructor(name : string, priority : number, disabled? : boolean) {
        this._name = name;
        this._priority = priority;

        if (disabled) {
            this._disabled = disabled;
        }
    }

    get disabled() : boolean { return this._disabled; }
    set disabled(flag : boolean) { this._disabled = flag; }

    get name() : string { return this._name; }

    get priority() : number { return this._priority; }
    set priority( pri : number )  { this._priority = pri; }

    abstract getOptions(currentOptions : CliOptions, addIns : AddIn[]) : CliOptions | null;
    abstract addIn(server : CFExpressServer, addIns : AddIn[]) : void;
}


import { serverAddIn } from './addins/create-server';
import { helmetAddIn } from './addins/helmet';
import { log4jsAddIn } from './addins/logging';
import { sessionAddIn } from './addins/sessions';
import { cloudantStoreAddIn } from './addins/cloudant-store';
import { appIdAddIn } from './addins/appid-webstrategy';

export * from './addins/create-server';
export * from './addins/helmet';
export * from './addins/logging';
export * from './addins/sessions';
export * from './addins/cloudant-store';
export * from './addins/appid-webstrategy';



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

export enum CommonConfigNames {
    ENV = 'env',
    PORT = 'port',
    BIND = 'bind',
    LOG_LEVEL = 'logLevel'
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

function configure(options: ConfigOptions): Config {

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
    getConfig(): Config;
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

    _addins = _addins.sort((a, b) => {
        return a.priority - b.priority;
    });

    _addins.filter(curAddin => !curAddin.disabled).forEach(curAddin => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions as CliOptions, _addins));
    });

    app.getLogger = (name?: string) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return _log4jsGetLogger(lname);
    }

    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; }

    app.start = (listener?: Function) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get(CommonConfigNames.PORT), () => {
            log.info('Listening on port: ' + appConfig.get(CommonConfigNames.PORT));
            if (listener)
                listener();
        });
    }

    _addins.filter(curAddin => !curAddin.disabled).forEach((curAddin: AddIn) => {
        curAddin.addIn(app, _addins);
    });

    return app;
}
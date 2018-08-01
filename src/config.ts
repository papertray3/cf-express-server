import { config } from 'dotenv';
import { resolve, normalize } from 'path';
import yargs from 'yargs';
import nconf = require('nconf');

const cfenv = require('cfenv');

// Add an optional env string to Yargs Options
// this allows a cli (e.g. --someOption) but also
// specify an env variable as a backup
export interface CliOption extends yargs.Options {
    env?: string | Array<string>,
    confDefault?: any
}

export interface CliOptions {
    [option: string] : CliOption
}

export interface ConfigOptions {
    version?: string,
    envPath?: string,
    usage?: string,
    cliOptions?: CliOptions,
    defaults?: ConfigDefaults
}

export const commonOptions : CliOptions = {
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
        describe: 'log4js log level. Use env:LOG4JS_CONFIG to point to a configuration file (https://www.npmjs.com/package/log4js).',
        type: 'string',
        env: 'LOG_LEVEL',
        confDefault: 'info'
    }
}

type ConfigDefaults = {
    [key : string]: any
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

export function  getConfig(options : ConfigOptions) {
    let dotEnvPath = options.envPath;
    if (dotEnvPath) {
        config({path: resolve(normalize(dotEnvPath))});
    } else {
        config();
    }

    if (options.usage) yargs.usage(options.usage);
    if (options.version) yargs.version(options.version);
    let opts : CliOptions = options.cliOptions || commonOptions;
    let whitelist : Array<string> = [];
    let transforms : Transforms = {};
    let defaults : ConfigDefaults = options.defaults || {};

    Object.keys(opts).forEach((key: string) => {
        let opt = opts[key];
        if (opt.env) {
            opt.describe += ' (';
            let envs = Array.isArray(opt.env) ? opt.env : [opt.env];
            whitelist.push(key);
            envs.forEach((env : string, idx : number) => {
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
            transform: (obj: NconfObject) : NconfObject | boolean => {
                if (transforms[obj.key]) {
                    return transforms[obj.key](obj);
                }

                return obj;
            }
        });

    nconf.defaults(defaults);

    nconf.overrides({
        isLocal: cfenv.getAppEnv().isLocal
    });

    console.log(`port: ${nconf.get('port')}`);
    if (cfenv.getAppEnv().isLocal && !process.env.PORT) {
        if (nconf.get('port')) {
            process.env.PORT = nconf.get('port');
        }
    }

    nconf.add('cfenv', {type: 'literal', store: cfenv.getAppEnv()});

    return nconf;
}
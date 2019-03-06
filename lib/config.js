"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
const nconf_1 = __importDefault(require("nconf"));
const cfenv = require('cfenv');
exports.commonOptions = {
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
};
// basic transform
let bt = (newKey) => {
    return (obj) => {
        return {
            key: newKey,
            value: obj.value
        };
    };
};
function configure(options) {
    let dotEnvPath = options.envPath;
    if (dotEnvPath) {
        dotenv_1.config({ path: path_1.resolve(path_1.normalize(dotEnvPath)) });
    }
    else {
        dotenv_1.config();
    }
    if (options.usage)
        yargs_1.default.usage(options.usage);
    if (options.version)
        yargs_1.default.version(options.version);
    let opts = options.cliOptions || exports.commonOptions;
    let whitelist = [];
    let transforms = {};
    let defaults = {};
    Object.keys(opts).forEach((key) => {
        let opt = opts[key];
        if (opt.env) {
            opt.describe += ' (';
            let envs = Array.isArray(opt.env) ? opt.env : [opt.env];
            whitelist.push(key);
            envs.forEach((env, idx) => {
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
    yargs_1.default.options(opts);
    nconf_1.default
        .argv(yargs_1.default)
        .env({
        parseValues: true,
        whitelist: whitelist,
        transform: (obj) => {
            if (transforms[obj.key]) {
                return transforms[obj.key](obj);
            }
            return obj;
        }
    });
    nconf_1.default.defaults(defaults);
    let overrides = options.overrides || {};
    if (!overrides.isLocal) {
        overrides.isLocal = cfenv.getAppEnv().isLocal;
    }
    nconf_1.default.overrides(overrides);
    if (cfenv.getAppEnv().isLocal && !process.env.PORT) {
        if (nconf_1.default.get('port')) {
            process.env.PORT = nconf_1.default.get('port');
        }
    }
    nconf_1.default.add('cfenv', { type: 'literal', store: cfenv.getAppEnv() });
    return nconf_1.default;
}
exports.configure = configure;

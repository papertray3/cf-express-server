"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const log4js_1 = require("log4js");
const nconf_1 = __importDefault(require("nconf"));
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const yargs_1 = __importDefault(require("yargs"));
class BasicAddIn {
    constructor(name, priority, disabled) {
        this._disabled = false;
        this._name = name;
        this._priority = priority;
        if (disabled) {
            this._disabled = disabled;
        }
    }
    get disabled() { return this._disabled; }
    set disabled(flag) { this._disabled = flag; }
    get name() { return this._name; }
    get priority() { return this._priority; }
    set priority(pri) { this._priority = pri; }
}
exports.BasicAddIn = BasicAddIn;
const create_server_1 = require("./addins/create-server");
const helmet_1 = require("./addins/helmet");
const logging_1 = require("./addins/logging");
const sessions_1 = require("./addins/sessions");
const cloudant_store_1 = require("./addins/cloudant-store");
const appid_webstrategy_1 = require("./addins/appid-webstrategy");
__export(require("./addins/create-server"));
__export(require("./addins/helmet"));
__export(require("./addins/logging"));
__export(require("./addins/sessions"));
__export(require("./addins/cloudant-store"));
__export(require("./addins/appid-webstrategy"));
let _addins = [logging_1.log4jsAddIn, helmet_1.helmetAddIn, cloudant_store_1.cloudantStoreAddIn, sessions_1.sessionAddIn, appid_webstrategy_1.appIdAddIn, create_server_1.serverAddIn];
const cfenv = require('cfenv');
var CommonConfigNames;
(function (CommonConfigNames) {
    CommonConfigNames["ENV"] = "env";
    CommonConfigNames["PORT"] = "port";
    CommonConfigNames["BIND"] = "bind";
    CommonConfigNames["LOG_LEVEL"] = "logLevel";
    CommonConfigNames["IS_LOCAL"] = "isLocal";
})(CommonConfigNames = exports.CommonConfigNames || (exports.CommonConfigNames = {}));
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
function CreateCFServer(configuration, addins) {
    const app = express_1.default();
    if (configuration && !configuration.cliOptions)
        configuration.cliOptions = exports.commonOptions;
    let config = configuration ? configuration : {
        cliOptions: exports.commonOptions
    };
    if (addins)
        _addins = _addins.concat(addins);
    _addins = _addins.sort((a, b) => {
        return a.priority - b.priority;
    });
    _addins.filter(curAddin => !curAddin.disabled).forEach(curAddin => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions, _addins));
    });
    app.getLogger = (name) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return log4js_1.getLogger(lname);
    };
    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; };
    app.start = (listener) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get(CommonConfigNames.PORT), () => {
            log.info('Listening on port: ' + appConfig.get(CommonConfigNames.PORT));
            if (listener)
                listener();
        });
    };
    _addins.filter(curAddin => !curAddin.disabled).forEach((curAddin) => {
        curAddin.addIn(app, _addins);
    });
    return app;
}
exports.CreateCFServer = CreateCFServer;

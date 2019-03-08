"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const appid_webstrategy_1 = require("./appid-webstrategy");
const options = {
    noSession: {
        describe: 'Turn off session middleware (https://www.npmjs.com/package/express-session)',
        type: 'boolean',
        default: undefined,
        env: 'NO_SESSION',
        group: 'Server Options'
    }
};
let sessionConfig = {
    secret: 'random stuff',
    resave: false,
    saveUninitialized: true
};
let defaultConfig = true;
exports.sessionAddIn = {
    disabled: false,
    priority: 250,
    getOptions: (currentOptions) => options,
    configure: (options) => {
        sessionConfig = options;
        defaultConfig = false;
    },
    addIn: (server) => {
        const log = server.getLogger('sessionAddIn');
        const config = server.getConfig();
        if (config.get('noSession')) {
            log.debug('Session AddIn disabled');
            if (!appid_webstrategy_1.appIdAddIn.disabled) {
                config.required(['noSignOn']);
            }
            return;
        }
        server.use(passport_1.default.initialize());
        log.info('Configuring sessions');
        server.use(express_session_1.default(sessionConfig));
        if (defaultConfig) {
            log.info('Using default configuration for sessions. Consider configuring a session store.');
        }
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const index_1 = require("../index");
const options = {
    noSession: {
        describe: 'Turn off session middleware (https://www.npmjs.com/package/express-session)',
        type: 'boolean',
        default: undefined,
        env: 'NO_SESSION',
        group: 'Server Options'
    }
};
var SessionConfigNames;
(function (SessionConfigNames) {
    SessionConfigNames["SESSION_OFF"] = "noSession";
})(SessionConfigNames = exports.SessionConfigNames || (exports.SessionConfigNames = {}));
exports.SESSION_ADDIN_NAME = 'sessionAddIn';
exports.SESSION_ADDIN_PRIORITY = 250;
class SessionAddInImpl extends index_1.BasicAddIn {
    constructor() {
        super(...arguments);
        this._sessionConfig = {
            secret: 'random stuff',
            resave: false,
            saveUninitialized: true
        };
        this._defaultConfig = true;
    }
    configure(options) {
        this._sessionConfig = options;
        this._defaultConfig = false;
    }
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        const log = server.getLogger(this.name);
        const config = server.getConfig();
        log.info('Configuring sessions');
        server.use(express_session_1.default(this._sessionConfig));
        if (this._defaultConfig) {
            log.warn('Using default configuration for sessions. Consider configuring a session store.');
        }
    }
}
exports.sessionAddIn = new SessionAddInImpl(exports.SESSION_ADDIN_NAME, exports.SESSION_ADDIN_PRIORITY);

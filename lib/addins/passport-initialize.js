"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const appid_webstrategy_1 = require("./appid-webstrategy");
const options = {
    'noPassport': {
        describe: 'Disable Passport security (https://www.npmjs.com/package/passport)',
        type: 'boolean',
        default: undefined,
        env: 'NO_PASSPORT'
    }
};
exports.passportInitializeAddIn = {
    disabled: true,
    priority: 220,
    getOptions: (currentOptions) => options,
    addIn: (server) => {
        const log = server.getLogger('passportInitializeAddIn');
        const config = server.getConfig();
        if (config.get('noPassport')) {
            log.debug('Passport Initialization AddIn disabled');
            if (!appid_webstrategy_1.appIdAddIn.disabled) {
                config.required(['noSignOn']);
            }
            return;
        }
        server.use(passport_1.default.initialize());
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const options = {
    noHelmet: {
        describe: 'Turn off helmet middleware (https://www.npmjs.com/package/helmet)',
        type: 'boolean',
        default: undefined,
        env: 'NO_HELMET',
        group: 'Server Options'
    }
};
let helmetConfig;
exports.helmetAddIn = {
    disabled: false,
    priority: 110,
    configure: (options) => { helmetConfig = options; },
    getOptions: (currentOptions) => { return options; },
    addIn: (server) => {
        const log = server.getLogger('helmetAddIn');
        const config = server.getConfig();
        if (config.get('noHelmet')) {
            log.debug('Helmet AddIn disabled');
            return;
        }
        log.info('Configuring helmet');
        if (!helmetConfig)
            log.info('Using default configuration');
        server.use(helmet_1.default(helmetConfig));
    }
};

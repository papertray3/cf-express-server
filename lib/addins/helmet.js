"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const index_1 = require("../index");
const options = {
    noHelmet: {
        describe: 'Turn off helmet middleware (https://www.npmjs.com/package/helmet)',
        type: 'boolean',
        default: undefined,
        env: 'NO_HELMET',
        group: 'Server Options'
    }
};
var HelmetConfigNames;
(function (HelmetConfigNames) {
    HelmetConfigNames["HELMET_OFF"] = "noHelmet";
})(HelmetConfigNames = exports.HelmetConfigNames || (exports.HelmetConfigNames = {}));
exports.HELMET_ADDIN_NAME = 'helmetAddIn';
exports.HELMET_ADDIN_PRIORITY = 110;
class HelmetAddInImpl extends index_1.BasicAddIn {
    configure(options) {
        this._helmetConfig = options;
    }
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        const log = server.getLogger(this.name);
        const config = server.getConfig();
        if (config.get(HelmetConfigNames.HELMET_OFF)) {
            log.info('Helmet AddIn disabled');
            return;
        }
        log.info('Configuring helmet');
        if (!this._helmetConfig)
            log.debug('Using default configuration');
        server.use(helmet_1.default(this._helmetConfig));
    }
}
exports.helmetAddIn = new HelmetAddInImpl(exports.HELMET_ADDIN_NAME, exports.HELMET_ADDIN_PRIORITY);

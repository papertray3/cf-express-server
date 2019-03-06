"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const log4js_1 = require("log4js");
const config_1 = require("./config");
const create_server_1 = require("./addins/create-server");
let _addins = [create_server_1.ServerAddIn];
function CreateCFServer(configuration, addins) {
    const app = express_1.default();
    if (configuration && !configuration.cliOptions)
        configuration.cliOptions = config_1.commonOptions;
    let config = configuration ? configuration : {
        cliOptions: config_1.commonOptions
    };
    if (addins)
        _addins = _addins.concat(addins).sort((a, b) => {
            return a.priority - b.priority;
        });
    _addins.forEach((curAddin) => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions));
    });
    app.getLogger = (name) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return log4js_1.getLogger(lname);
    };
    let appConfig = config_1.configure(config);
    app.getConfig = () => { return appConfig; };
    app.start = (listener) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get('port'), () => {
            log.info('Listening on port: ' + appConfig.get('port'));
            if (listener)
                listener();
        });
    };
    _addins.forEach((curAddin) => {
        curAddin.addIn(app);
    });
    return app;
}
exports.CreateCFServer = CreateCFServer;

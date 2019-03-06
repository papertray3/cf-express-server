"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const log4js_1 = require("log4js");
const config_1 = require("./config");
let _addins = [];
function CreateCFServer(configuration, loggerConfig, addins) {
    const app = express_1.default();
    let config = configuration ? configuration : {
        cliOptions: config_1.commonOptions
    };
    if (addins)
        _addins = _addins.concat(addins);
    _addins.forEach((curAddin) => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions));
    });
    if (loggerConfig) {
        if (typeof loggerConfig === 'string')
            log4js_1.configure(loggerConfig);
        else
            log4js_1.configure(loggerConfig);
    }
    app.getLogger = (name) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return log4js_1.getLogger(lname);
    };
    let appConfig = config_1.configure(config);
    app.getConfig = () => { return appConfig; };
    app.start = (listener) => {
        return app.listen(appConfig.get('PORT'), listener);
    };
    _addins.forEach((curAddin) => {
        curAddin.addIn(app);
    });
    return app;
}
exports.CreateCFServer = CreateCFServer;

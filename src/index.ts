import express, { Express } from 'express';
import { configure as _log4jsConfigure, getLogger as _log4jsGetLogger, Logger, Configuration } from 'log4js';
import nconf, { add } from 'nconf';

import { configure, commonOptions, CliOptions, ConfigOptions } from './config';
import { Server } from 'net';

export { CliOptions, ConfigOptions };


export interface CFExpressServer extends Express {
    getConfig() : typeof nconf;
    getLogger(name? : string) : Logger;
    start(listener?: Function): Server;
}


export interface AddIn {
    getOptions(currentOptions: CliOptions) : CliOptions;
    addIn(server : CFExpressServer) : void;
}

let _addins : AddIn[] = [];

export function CreateCFServer(configuration?:ConfigOptions, loggerConfig?: Configuration | string, addins? : AddIn[]) : CFExpressServer {
    const app : CFExpressServer = express() as CFExpressServer;

    let config : ConfigOptions = configuration ? configuration : {
        cliOptions : commonOptions
    }

    if (addins)
        _addins = _addins.concat(addins);

    _addins.forEach((curAddin : AddIn) => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions as CliOptions));
    });
    

    if (loggerConfig) {
        if (typeof loggerConfig === 'string')
            _log4jsConfigure(loggerConfig as string);
        else 
            _log4jsConfigure(loggerConfig as Configuration);
    }

    app.getLogger = (name? : string) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return _log4jsGetLogger(lname);
    }

    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; }

    app.start = (listener? : Function) => {
        return app.listen(appConfig.get('PORT'), listener);
    }

    _addins.forEach((curAddin : AddIn) => { 
        curAddin.addIn(app);
    });
   
    return app;
}
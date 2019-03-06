import { Server } from 'net';
import express, { Express } from 'express';
import { getLogger as _log4jsGetLogger, Logger, Configuration } from 'log4js';
import nconf, { add } from 'nconf';

import { configure, commonOptions, CliOptions, ConfigOptions } from './config';
import { ServerAddIn } from './addins/create-server';

export { CliOptions, ConfigOptions };

export interface CFExpressServer extends Express {
    getConfig() : typeof nconf;
    getLogger(name? : string) : Logger;
    start(listener?: Function): Server;
}


export interface AddIn {
    priority: number, //builtin addins will start at 100
    getOptions(currentOptions: CliOptions) : CliOptions;
    addIn(server : CFExpressServer) : void;
}

let _addins : AddIn[] = [ServerAddIn];

export function CreateCFServer(configuration?:ConfigOptions, addins? : AddIn[]) : CFExpressServer {
    const app : CFExpressServer = express() as CFExpressServer;

    if (configuration && !configuration.cliOptions)
        configuration.cliOptions = commonOptions;

    let config : ConfigOptions = configuration ? configuration : {
        cliOptions : commonOptions
    }

    if (addins)
        _addins = _addins.concat(addins).sort((a, b) => {
            return a.priority - b.priority;
        });

    _addins.forEach((curAddin : AddIn) => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions as CliOptions));
    });

    app.getLogger = (name? : string) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return _log4jsGetLogger(lname);
    }

    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; }

    app.start = (listener? : Function) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get('port'), () => {
            log.info('Listening on port: ' + appConfig.get('port'));
            if (listener)
                listener();
        });
    }

    _addins.forEach((curAddin : AddIn) => { 
        curAddin.addIn(app);
    });
   
    return app;
}
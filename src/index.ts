import { Server } from 'net';
import express, { Express } from 'express';
import { getLogger as _log4jsGetLogger, Logger } from 'log4js';
import { CliOptions, Config, ConfigOptions, commonOptions, configure, CommonConfigNames } from '@papertray3/cf-express-config';

export interface AddIn {
    name: string,
    disabled: boolean,
    priority: number, //builtin addins will start at 100
    getOptions(currentOptions: CliOptions, addIns : AddIn[]): CliOptions | null;
    addIn(server: CFExpressServer, addIns : AddIn[]): void;
}

export abstract class BasicAddIn implements AddIn {
    private _name : string;
    private _disabled : boolean = false;
    private _priority : number;

    constructor(name : string, priority : number, disabled? : boolean) {
        this._name = name;
        this._priority = priority;

        if (disabled) {
            this._disabled = disabled;
        }
    }

    get disabled() : boolean { return this._disabled; }
    set disabled(flag : boolean) { this._disabled = flag; }

    get name() : string { return this._name; }

    get priority() : number { return this._priority; }
    set priority( pri : number )  { this._priority = pri; }

    getOptions(currentOptions : CliOptions, addIns : AddIn[]) : CliOptions | null {
        return null;
    }
    
    abstract addIn(server : CFExpressServer, addIns : AddIn[]) : void;
}


import { serverAddIn } from './addins/create-server';
import { helmetAddIn } from './addins/helmet';
import { log4jsAddIn } from './addins/logging';
import { sessionAddIn } from './addins/sessions';
import { cloudantStoreAddIn } from './addins/cloudant-store';
import { appIdAddIn } from './addins/appid-webstrategy';

export * from './addins/create-server';
export * from './addins/helmet';
export * from './addins/logging';
export * from './addins/sessions';
export * from './addins/cloudant-store';
export * from './addins/appid-webstrategy';



let _addins: AddIn[] = [log4jsAddIn, helmetAddIn, cloudantStoreAddIn, sessionAddIn, appIdAddIn, serverAddIn];


export interface CFExpressServer extends Express {
    getConfig(): Config;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}

export interface CFServerConfigOptions extends ConfigOptions {
    loggerName?: string
}

export function CreateCFServer(configuration?: CFServerConfigOptions, addins?: AddIn[]): CFExpressServer {
    const app: CFExpressServer = express() as CFExpressServer;

    if (configuration && !configuration.cliOptions)
        configuration.cliOptions = commonOptions;

    let config: CFServerConfigOptions = configuration ? configuration : {
        cliOptions: commonOptions
    }

    if (addins)
        _addins = _addins.concat(addins);

    _addins = _addins.sort((a, b) => {
        return a.priority - b.priority;
    });

    _addins.filter(curAddin => !curAddin.disabled).forEach(curAddin => {
        config.cliOptions = Object.assign(config.cliOptions, curAddin.getOptions(config.cliOptions as CliOptions, _addins));
    });

    app.getLogger = (name?: string) => {
        let lname = config.loggerName ? config.loggerName + (name ? ':' + name : '') : name;
        return _log4jsGetLogger(lname);
    }

    let appConfig = configure(config);
    app.getConfig = () => { return appConfig; }

    app.start = (listener?: Function) => {
        const log = app.getLogger('CreateCFServer');
        return app.listen(appConfig.get(CommonConfigNames.PORT), () => {
            log.info('Listening on port: ' + appConfig.get(CommonConfigNames.PORT));
            if (listener)
                listener();
        });
    }

    _addins.filter(curAddin => !curAddin.disabled).forEach((curAddin: AddIn) => {
        curAddin.addIn(app, _addins);
    });

    return app;
}
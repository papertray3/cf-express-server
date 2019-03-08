/// <reference types="node" />
import { Server } from 'net';
import { Express } from 'express';
import { Logger } from 'log4js';
import nconf from 'nconf';
import yargs from 'yargs';
import { serverAddIn } from './addins/create-server';
import { helmetAddIn } from './addins/helmet';
import { log4jsAddIn } from './addins/logging';
import { sessionAddIn } from './addins/sessions';
import { cloudantStoreAddIn } from './addins/cloudant-store';
import { passportInitializeAddIn } from './addins/passport-initialize';
import { appIdAddIn } from './addins/appid-webstrategy';
export { serverAddIn, helmetAddIn, log4jsAddIn, sessionAddIn, cloudantStoreAddIn, appIdAddIn, passportInitializeAddIn };
export interface AddIn {
    disabled: boolean;
    priority: number;
    getOptions(currentOptions: CliOptions): CliOptions | null;
    addIn(server: CFExpressServer): void;
}
export interface CliOption extends yargs.Options {
    env?: string | Array<string>;
    confDefault?: any;
}
export interface CliOptions {
    [option: string]: CliOption;
}
export interface ConfigOptions {
    version?: string;
    loggerName?: string;
    envPath?: string;
    usage?: string;
    cliOptions?: CliOptions;
    overrides?: ConfigDefaults;
}
export declare const commonOptions: CliOptions;
declare type ConfigDefaults = {
    [key: string]: any;
};
export interface CFExpressServer extends Express {
    getConfig(): typeof nconf;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}
export declare function CreateCFServer(configuration?: ConfigOptions, addins?: AddIn[]): CFExpressServer;

/// <reference types="node" />
import { Express } from 'express';
import { Logger, Configuration } from 'log4js';
import nconf from 'nconf';
import { CliOptions, ConfigOptions } from './config';
import { Server } from 'net';
export { CliOptions, ConfigOptions };
export interface CFExpressServer extends Express {
    getConfig(): typeof nconf;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}
export interface AddIn {
    getOptions(currentOptions: CliOptions): CliOptions;
    addIn(server: CFExpressServer): void;
}
export declare function CreateCFServer(configuration?: ConfigOptions, loggerConfig?: Configuration | string, addins?: AddIn[]): CFExpressServer;

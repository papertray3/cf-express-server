/// <reference types="node" />
import { Server } from 'net';
import { Express } from 'express';
import { Logger } from 'log4js';
import nconf from 'nconf';
import { CliOptions, ConfigOptions } from './config';
export { CliOptions, ConfigOptions };
export interface CFExpressServer extends Express {
    getConfig(): typeof nconf;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}
export interface AddIn {
    priority: number;
    getOptions(currentOptions: CliOptions): CliOptions;
    addIn(server: CFExpressServer): void;
}
export declare function CreateCFServer(configuration?: ConfigOptions, addins?: AddIn[]): CFExpressServer;

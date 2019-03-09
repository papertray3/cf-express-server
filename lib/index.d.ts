/// <reference types="node" />
import { Server } from 'net';
import { Express } from 'express';
import { Logger } from 'log4js';
import nconf from 'nconf';
import yargs from 'yargs';
export declare type Config = typeof nconf;
export interface AddIn {
    name: string;
    disabled: boolean;
    priority: number;
    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null;
    addIn(server: CFExpressServer, addIns: AddIn[]): void;
}
export declare abstract class BasicAddIn implements AddIn {
    private _name;
    private _disabled;
    private _priority;
    constructor(name: string, priority: number, disabled?: boolean);
    disabled: boolean;
    readonly name: string;
    priority: number;
    abstract getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null;
    abstract addIn(server: CFExpressServer, addIns: AddIn[]): void;
}
export * from './addins/create-server';
export * from './addins/helmet';
export * from './addins/logging';
export * from './addins/sessions';
export * from './addins/cloudant-store';
export * from './addins/appid-webstrategy';
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
    getConfig(): Config;
    getLogger(name?: string): Logger;
    start(listener?: Function): Server;
}
export declare function CreateCFServer(configuration?: ConfigOptions, addins?: AddIn[]): CFExpressServer;

import yargs from 'yargs';
import nconf = require('nconf');
export interface CliOption extends yargs.Options {
    env?: string | Array<string>;
    confDefault?: any;
}
export interface CliOptions {
    [option: string]: CliOption;
}
export interface ConfigOptions {
    version?: string;
    envPath?: string;
    usage?: string;
    cliOptions?: CliOptions;
    overrides?: ConfigDefaults;
}
export declare const commonOptions: CliOptions;
declare type ConfigDefaults = {
    [key: string]: any;
};
export declare function getConfig(options: ConfigOptions): typeof nconf;
export {};

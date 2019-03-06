import yargs from 'yargs';
import nconf from 'nconf';
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
export declare function configure(options: ConfigOptions): typeof nconf;
export {};

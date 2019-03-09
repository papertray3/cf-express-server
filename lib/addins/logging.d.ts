import { Configuration } from 'log4js';
import { AddIn } from '../index';
export declare enum Log4jsConfigNames {
    LOG_LEVEL = "logLevel"
}
export declare const LOG4JS_ADDIN_NAME = "log4jsAddIn";
export declare const LOG4JS_ADDIN_PRIORITY = 100;
export interface Log4jsAddIn extends AddIn {
    configure(options: Configuration): void;
}
export declare const log4jsAddIn: Log4jsAddIn;

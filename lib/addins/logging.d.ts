import { Configuration } from 'log4js';
import { AddIn } from '../index';
export interface Log4jsAddIn extends AddIn {
    configure(options: Configuration): void;
}
export declare const log4jsAddIn: Log4jsAddIn;

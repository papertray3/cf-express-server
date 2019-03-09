import { SessionOptions } from 'express-session';
import { AddIn } from '../index';
export declare const SESSION_ADDIN_NAME = "sessionAddIn";
export declare const SESSION_ADDIN_PRIORITY = 250;
export interface SessionAddIn extends AddIn {
    configure(options: SessionOptions): void;
}
export declare const sessionAddIn: SessionAddIn;

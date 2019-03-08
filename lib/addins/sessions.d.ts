import { SessionOptions } from 'express-session';
import { AddIn } from '../index';
export interface SessionAddIn extends AddIn {
    configure(options: SessionOptions): void;
}
export declare const sessionAddIn: SessionAddIn;

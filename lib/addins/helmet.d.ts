import { IHelmetConfiguration } from 'helmet';
import { AddIn } from '../index';
export declare const HELMET_ADDIN_NAME = "helmetAddIn";
export declare const HELMET_ADDIN_PRIORITY = 110;
export interface HelmetAddIn extends AddIn {
    configure(options: IHelmetConfiguration): void;
}
export declare const helmetAddIn: HelmetAddIn;

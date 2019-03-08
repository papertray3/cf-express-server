import { IHelmetConfiguration } from 'helmet';
import { AddIn } from '../index';
export interface HelmetAddIn extends AddIn {
    configure(options: IHelmetConfiguration): void;
}
export declare const helmetAddIn: HelmetAddIn;

import nconf from 'nconf';
import { AddIn } from '../index';
export declare const APPID_ADDIN_NAME = "appIdAddIn";
export declare const APPID_ADDIN_PRIORITY = 700;
export interface AppIdUris {
    landingPage: string;
    login: string;
    callback: string;
    logout: string;
}
export declare const defaultAppIdUris: AppIdUris;
export declare type RedirectUriFunction = (config: typeof nconf) => string;
export interface AppIdAddIn extends AddIn {
    configure(redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void;
}
export declare const appIdAddIn: AppIdAddIn;

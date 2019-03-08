import { AddIn } from '../index';
export interface AppIdUris {
    landingPage: string;
    login: string;
    callback: string;
    logout: string;
}
export declare const defaultAppIdUris: AppIdUris;
export declare type RedirectUriFunction = () => string;
export interface AppIdAddIn extends AddIn {
    configure(redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void;
}
export declare const appIdAddIn: AppIdAddIn;

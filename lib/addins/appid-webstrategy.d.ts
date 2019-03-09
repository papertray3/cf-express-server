import { AddIn, Config } from '../index';
export declare enum AppIdConfigNames {
    APPID_OFF = "noSignOn",
    APPID_TENANT_ID = "appIdTenantId",
    APPID_CLIENT_ID = "appIdClientId",
    APPID_SECRET = "appIdSecret",
    APPID_OAUTH_SERVER_URL = "appIdOauthServerUrl"
}
export declare const APPID_ADDIN_NAME = "appIdAddIn";
export declare const APPID_ADDIN_PRIORITY = 700;
export interface AppIdUris {
    landingPage: string;
    login: string;
    callback: string;
    logout: string;
}
export declare const defaultAppIdUris: AppIdUris;
export declare type RedirectUriFunction = (config: Config) => string;
export interface AppIdAddIn extends AddIn {
    configure(redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void;
}
export declare const appIdAddIn: AppIdAddIn;

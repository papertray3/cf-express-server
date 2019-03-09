import express from 'express';
import passport from 'passport';
import nconf from 'nconf';

import { AddIn, CliOptions, CFExpressServer, BasicAddIn, Config } from '../index';
import { SESSION_ADDIN_NAME } from './sessions';

const WebAppStrategy = require('ibmcloud-appid').WebAppStrategy;

interface WebAppStrategyAuthenticationOptions extends passport.AuthenticateOptions {
    forceLogin?: boolean
}

const GROUP = 'AppID Options'

const options: CliOptions = {
    noSignOn: {
        describe: 'Turn off AppID middleware (https://www.npmjs.com/package/ibmcloud-appid)',
        type: 'boolean',
        env: 'NO_SIGN_ON',
        default: undefined,
        group: GROUP
    },
    appIdTenantId: {
        describe: 'Tenant ID for AppID Service. This is unnecessary if deployed to the IBM Cloud with a connection to an AppID instance.',
        type: 'string',
        env: 'APPID_TENANT_ID',
        implies: ['appIdClientId', 'appIdSecret', 'appIdOauthServerUrl'],
        group: GROUP
    },
    appIdClientId: {
        describe: 'Client ID for AppID Service. This is unnecessary if deployed to the IBM Cloud with a connection to an AppID instance.',
        type: 'string',
        env: 'APPID_CLIENT_ID',
        implies: ['appIdTenantId', 'appIdSecret', 'appIdOauthServerUrl'],
        group: GROUP
    },
    appIdSecret: {
        describe: 'Secret Key for AppID Service. This is unnecessary if deployed to the IBM Cloud with a connection to an AppID instance.',
        type: 'string',
        env: 'APPID_SECRET',
        implies: ['appIdTenantId', 'appIdClientId', 'appIdOauthServerUrl'],
        group: GROUP
    },
    appIdOauthServerUrl: {
        describe: 'OAUTH Server URL AppID Service. This is unnecessary if deployed to the IBM Cloud with a connection to an AppID instance.',
        type: 'string',
        env: 'APPID_OAUTH_SERVER_URL',
        implies: ['appIdTenantId', 'appIdClientId', 'appIdSecret'],
        group: GROUP
    }
}

export enum AppIdConfigNames {
    APPID_OFF = 'noSignOn',
    APPID_TENANT_ID = 'appIdTenantId',
    APPID_CLIENT_ID = 'appIdClientId',
    APPID_SECRET = 'appIdSecret',
    APPID_OAUTH_SERVER_URL = 'appIdOauthServerUrl'
}

export const APPID_ADDIN_NAME = 'appIdAddIn';
export const APPID_ADDIN_PRIORITY = 700;

export interface AppIdUris {
    landingPage: string,
    login: string,
    callback: string,
    logout: string
}

export const defaultAppIdUris: AppIdUris = {
    landingPage: '/',
    login: '/ibm/bluemix/appid/login',
    callback: '/ibm/bluemix/appid/callback',
    logout: '/ibm/bluemix/appid/logout'
}

export type RedirectUriFunction = (config: Config) => string;

export interface AppIdAddIn extends AddIn {
    configure(redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void;
}

class AppIdAddInImpl extends BasicAddIn implements AppIdAddIn {

    protected _appIdUrisConfig: AppIdUris | undefined;
    protected _redirectUriConfig: string | RedirectUriFunction | undefined;

    configure(redirectUri?: string | RedirectUriFunction | undefined, appIdUris?: AppIdUris | undefined): void {
        if (redirectUri)
            this._redirectUriConfig = redirectUri;

        if (appIdUris) {
            this._appIdUrisConfig = appIdUris;
        } else {
            this._appIdUrisConfig = defaultAppIdUris;
        }
    }
   
    
    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }   
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        const log = server.getLogger(this.name);
        const config = server.getConfig();

        if (config.get(AppIdConfigNames.APPID_OFF)) {
            log.debug('AppID AddIn disabled');
            return;
        }

        let sessionAddIn : AddIn | undefined = addIns.find(curAddIn => curAddIn.name == SESSION_ADDIN_NAME);
        if (!sessionAddIn || sessionAddIn.disabled) {
            log.error('AppId AddIn is depenedent on Session AddIn...AppId AddIn will be disabled');
            this.disabled = true;
            return;
        }

        log.debug('Setting up AppID...protected resources should be configured before this AddIn. Current priority of this AddIn is: ', appIdAddIn.priority);

        server.use(passport.initialize());
        server.use(passport.session());

        if (!this._appIdUrisConfig)
            this._appIdUrisConfig = defaultAppIdUris;

        log.debug('AppId URI configuration:');
        log.debug(this._appIdUrisConfig);

        const webappStrategyOptions: any = !config.get(AppIdConfigNames.APPID_TENANT_ID) ? {} : {
            tenantId: config.get(AppIdConfigNames.APPID_TENANT_ID),
            clientId: config.get(AppIdConfigNames.APPID_CLIENT_ID),
            secret: config.get(AppIdConfigNames.APPID_SECRET),
            oauthServerUrl: config.get(AppIdConfigNames.APPID_OAUTH_SERVER_URL),
        };

        if (this._redirectUriConfig) {
            webappStrategyOptions.redirectUri = typeof this._redirectUriConfig === 'string' ? this._redirectUriConfig : this._redirectUriConfig(server.getConfig());
        }



        passport.use(new WebAppStrategy(webappStrategyOptions));

        passport.serializeUser(function (user, cb) {
            cb(null, user);
        });

        passport.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });

        // Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}. If forceLogin is set to false the redirect to login widget will not occur if user is already authenticated
        server.get(this._appIdUrisConfig.login, passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
            successRedirect: this._appIdUrisConfig.landingPage,
            forceLogin: true
        } as WebAppStrategyAuthenticationOptions), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            log.info('here...start');
            next();
        });

        server.get(this._appIdUrisConfig.callback, passport.authenticate(WebAppStrategy.STRATEGY_NAME), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            log.info('here...hello');
            next();
        });

        // Logout endpoint. Clears authentication information from session
        server.get(this._appIdUrisConfig.logout, (req: express.Request, res: express.Response) => {
            WebAppStrategy.logout(req);
            res.redirect((<AppIdUris>this._appIdUrisConfig).landingPage);
        });

        // Protected area. If current user is not authenticated - redirect to the login widget will be returned.
        // In case user is authenticated - a page with current user information will be returned.
        server.use(passport.authenticate(WebAppStrategy.STRATEGY_NAME), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            next();
        });
    }
}

export const appIdAddIn: AppIdAddIn = new AppIdAddInImpl(APPID_ADDIN_NAME, APPID_ADDIN_PRIORITY);
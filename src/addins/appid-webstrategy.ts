import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser'

import { AddIn, CliOptions, CFExpressServer } from '../index';

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

export type RedirectUriFunction = () => string;

export interface AppIdAddIn extends AddIn {
    configure(redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void;
}

let appIdUrisConfig: AppIdUris;
let redirectUriConfig: string | RedirectUriFunction;


export const appIdAddIn: AppIdAddIn = {
    disabled: false,
    priority: 700,
    configure: (redirectUri?: string | RedirectUriFunction, appIdUris?: AppIdUris): void => {
        if (redirectUri)
            redirectUriConfig = redirectUri;

        if (appIdUris) {
            appIdUrisConfig = appIdUris;
        } else {
            appIdUrisConfig = defaultAppIdUris;
        }
    },
    getOptions: (currentOptions: CliOptions) => options,
    addIn: (server: CFExpressServer): void => {
        const log = server.getLogger('appIdAddIn');
        const config = server.getConfig();

        if (config.get('noSignOn')) {
            log.debug('AppID AddIn disabled');
            return;
        }
        /*
                if (passportInitializeAddIn.disabled || config.get('noPassport')) {
                    log.error('AppID AddIn requires Passport initialization. AppId AddIn will be disabled.');
                    return;
                }
            }
            */

        log.debug('Setting up AppID...protected resources should be configured before this AddIn. Current priority of this AddIn is: ', appIdAddIn.priority);

        server.use(bodyParser.urlencoded({extended: true}));
        server.use(bodyParser.json());
        server.use(passport.initialize());
        server.use(passport.session());


        log.debug(appIdUrisConfig);

        if (!appIdUrisConfig) 
            appIdUrisConfig = defaultAppIdUris;

/*         if (redirectUriConfig) {
            webappStrategyOptions.redirectUri = typeof redirectUriConfig === 'string' ? redirectUriConfig : redirectUriConfig();
        } */

        const webappStrategyOptions: any = !config.get('appIdTenantId') ? {} : {
            tenantId: config.get('appIdTenantId'),
            clientId: config.get('appIdClientId'),
            secret: config.get('appIdSecret'),
            oauthServerUrl: config.get('appIdOauthServerUrl'),
            redirectUri: config.get('url') + appIdUrisConfig.callback
        };

        passport.use(new WebAppStrategy(webappStrategyOptions));

        passport.serializeUser(function(user, cb) {
            cb(null, user);
        });
         
        passport.deserializeUser(function(obj, cb) {
            cb(null, obj);
        });
         
        // Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}. If forceLogin is set to false the redirect to login widget will not occur if user is already authenticated
        server.get(appIdUrisConfig.login, passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
            successRedirect: appIdUrisConfig.landingPage,
            forceLogin: true
        } as WebAppStrategyAuthenticationOptions), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            log.info('here...start');
            next();
        });

        server.get(appIdUrisConfig.callback, passport.authenticate(WebAppStrategy.STRATEGY_NAME), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            log.info('here...hello');
            next();
        });

        // Logout endpoint. Clears authentication information from session
        server.get(appIdUrisConfig.logout, (req: express.Request, res: express.Response) => {
            WebAppStrategy.logout(req);
            res.redirect(appIdUrisConfig.landingPage);
        });
    
        // Protected area. If current user is not authenticated - redirect to the login widget will be returned.
        // In case user is authenticated - a page with current user information will be returned.
        server.use(passport.authenticate(WebAppStrategy.STRATEGY_NAME), (req: express.Request, res: express.Response, next: express.NextFunction) => {
            log.info('here...hello');
            res.send('hello');
        });
    }
}
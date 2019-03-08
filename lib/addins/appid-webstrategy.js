"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const body_parser_1 = __importDefault(require("body-parser"));
const WebAppStrategy = require('ibmcloud-appid').WebAppStrategy;
const GROUP = 'AppID Options';
const options = {
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
};
exports.defaultAppIdUris = {
    landingPage: '/',
    login: '/ibm/bluemix/appid/login',
    callback: '/ibm/bluemix/appid/callback',
    logout: '/ibm/bluemix/appid/logout'
};
let appIdUrisConfig;
let redirectUriConfig;
exports.appIdAddIn = {
    disabled: false,
    priority: 700,
    configure: (redirectUri, appIdUris) => {
        if (redirectUri)
            redirectUriConfig = redirectUri;
        if (appIdUris) {
            appIdUrisConfig = appIdUris;
        }
        else {
            appIdUrisConfig = exports.defaultAppIdUris;
        }
    },
    getOptions: (currentOptions) => options,
    addIn: (server) => {
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
        log.debug('Setting up AppID...protected resources should be configured before this AddIn. Current priority of this AddIn is: ', exports.appIdAddIn.priority);
        server.use(body_parser_1.default.urlencoded({ extended: true }));
        server.use(body_parser_1.default.json());
        server.use(passport_1.default.initialize());
        server.use(passport_1.default.session());
        log.debug(appIdUrisConfig);
        if (!appIdUrisConfig)
            appIdUrisConfig = exports.defaultAppIdUris;
        /*         if (redirectUriConfig) {
                    webappStrategyOptions.redirectUri = typeof redirectUriConfig === 'string' ? redirectUriConfig : redirectUriConfig();
                } */
        const webappStrategyOptions = !config.get('appIdTenantId') ? {} : {
            tenantId: config.get('appIdTenantId'),
            clientId: config.get('appIdClientId'),
            secret: config.get('appIdSecret'),
            oauthServerUrl: config.get('appIdOauthServerUrl'),
            redirectUri: config.get('url') + appIdUrisConfig.callback
        };
        passport_1.default.use(new WebAppStrategy(webappStrategyOptions));
        passport_1.default.serializeUser(function (user, cb) {
            cb(null, user);
        });
        passport_1.default.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });
        // Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}. If forceLogin is set to false the redirect to login widget will not occur if user is already authenticated
        server.get(appIdUrisConfig.login, passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME, {
            successRedirect: appIdUrisConfig.landingPage,
            forceLogin: true
        }), (req, res, next) => {
            log.info('here...start');
            next();
        });
        server.get(appIdUrisConfig.callback, passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME), (req, res, next) => {
            log.info('here...hello');
            next();
        });
        // Logout endpoint. Clears authentication information from session
        server.get(appIdUrisConfig.logout, (req, res) => {
            WebAppStrategy.logout(req);
            res.redirect(appIdUrisConfig.landingPage);
        });
        // Protected area. If current user is not authenticated - redirect to the login widget will be returned.
        // In case user is authenticated - a page with current user information will be returned.
        server.use(passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME), (req, res, next) => {
            log.info('here...hello');
            res.send('hello');
        });
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const index_1 = require("../index");
const sessions_1 = require("./sessions");
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
exports.APPID_ADDIN_NAME = 'appIdAddIn';
exports.APPID_ADDIN_PRIORITY = 700;
exports.defaultAppIdUris = {
    landingPage: '/',
    login: '/ibm/bluemix/appid/login',
    callback: '/ibm/bluemix/appid/callback',
    logout: '/ibm/bluemix/appid/logout'
};
class AppIdAddInImpl extends index_1.BasicAddIn {
    configure(redirectUri, appIdUris) {
        if (redirectUri)
            this._redirectUriConfig = redirectUri;
        if (appIdUris) {
            this._appIdUrisConfig = appIdUris;
        }
        else {
            this._appIdUrisConfig = exports.defaultAppIdUris;
        }
    }
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        const log = server.getLogger(this.name);
        const config = server.getConfig();
        if (config.get('noSignOn')) {
            log.debug('AppID AddIn disabled');
            return;
        }
        let sessionAddIn = addIns.find(curAddIn => curAddIn.name == sessions_1.SESSION_ADDIN_NAME);
        if (!sessionAddIn || sessionAddIn.disabled) {
            log.error('AppId AddIn is depenedent on Session AddIn...AppId AddIn will be disabled');
            this.disabled = true;
            return;
        }
        log.debug('Setting up AppID...protected resources should be configured before this AddIn. Current priority of this AddIn is: ', exports.appIdAddIn.priority);
        server.use(passport_1.default.initialize());
        server.use(passport_1.default.session());
        if (!this._appIdUrisConfig)
            this._appIdUrisConfig = exports.defaultAppIdUris;
        log.debug('AppId URI configuration:');
        log.debug(this._appIdUrisConfig);
        const webappStrategyOptions = !config.get('appIdTenantId') ? {} : {
            tenantId: config.get('appIdTenantId'),
            clientId: config.get('appIdClientId'),
            secret: config.get('appIdSecret'),
            oauthServerUrl: config.get('appIdOauthServerUrl'),
        };
        if (this._redirectUriConfig) {
            webappStrategyOptions.redirectUri = typeof this._redirectUriConfig === 'string' ? this._redirectUriConfig : this._redirectUriConfig(server.getConfig());
        }
        passport_1.default.use(new WebAppStrategy(webappStrategyOptions));
        passport_1.default.serializeUser(function (user, cb) {
            cb(null, user);
        });
        passport_1.default.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });
        // Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}. If forceLogin is set to false the redirect to login widget will not occur if user is already authenticated
        server.get(this._appIdUrisConfig.login, passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME, {
            successRedirect: this._appIdUrisConfig.landingPage,
            forceLogin: true
        }), (req, res, next) => {
            log.info('here...start');
            next();
        });
        server.get(this._appIdUrisConfig.callback, passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME), (req, res, next) => {
            log.info('here...hello');
            next();
        });
        // Logout endpoint. Clears authentication information from session
        server.get(this._appIdUrisConfig.logout, (req, res) => {
            WebAppStrategy.logout(req);
            res.redirect(this._appIdUrisConfig.landingPage);
        });
        // Protected area. If current user is not authenticated - redirect to the login widget will be returned.
        // In case user is authenticated - a page with current user information will be returned.
        server.use(passport_1.default.authenticate(WebAppStrategy.STRATEGY_NAME), (req, res, next) => {
            next();
        });
    }
}
exports.appIdAddIn = new AppIdAddInImpl(exports.APPID_ADDIN_NAME, exports.APPID_ADDIN_PRIORITY);

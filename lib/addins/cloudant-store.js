"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const index_1 = require("../index");
const sessions_1 = require("./sessions");
const CloudantStore = require('connect-cloudant-store')(express_session_1.default);
const GROUP = 'Server Options';
const options = {
    noCloudantStore: {
        describe: 'Turn off IBM Cloudant Store for sessions (https://www.npmjs.com/package/connect-cloudant-store)',
        type: 'boolean',
        default: undefined,
        env: 'NO_CLOUDANT_STORE',
        group: GROUP
    },
    cloudantStoreUrl: {
        describe: 'URL for the cludant store (e.g., https://MYUSERNAME:MYPASSWORD@MYACCOUNT.cloudant.com)',
        type: 'string',
        env: 'CLOUDANT_STORE_URL',
        group: GROUP,
        conflicts: 'cloudantStoreInstanceName'
    },
    cloudantStoreInstanceName: {
        describe: 'VCAP Instance Name for cloudant store. For use when deployed on the IBM Cloud (conflicts with cloudantStoreUrl).',
        type: 'string',
        env: 'CLOUDANT_STORE_INSTANCE_NAME',
        group: GROUP
    }
};
var CloudantStoreConfigNames;
(function (CloudantStoreConfigNames) {
    CloudantStoreConfigNames["CLOUDANT_STORE_OFF"] = "noCloudantStore";
    CloudantStoreConfigNames["CLOUDANT_STORE_URL"] = "cloudantStoreUrl";
    CloudantStoreConfigNames["CLOUDANT_STORE_INSTANCE_NAME"] = "cloudantStoreInstanceName";
})(CloudantStoreConfigNames = exports.CloudantStoreConfigNames || (exports.CloudantStoreConfigNames = {}));
exports.CLOUDANT_STORE_ADDIN_NAME = 'cloudantStoreAddIn';
exports.CLOUDANT_STORE_ADDIN_PRIORITY = 200;
class CloudantStoreAddInImpl extends index_1.BasicAddIn {
    configure(sessionOptions, cloudantStoreOptions, storeCB) {
        if (storeCB)
            this._storeCallback = storeCB;
        this._cloudantStoreConfig = cloudantStoreOptions;
        this._sessionConfig = sessionOptions;
    }
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        const log = server.getLogger(this.name);
        const config = server.getConfig();
        if (config.get(CloudantStoreConfigNames.CLOUDANT_STORE_OFF)) {
            log.debug('Cloudant Session Store AddIn disabled');
            return;
        }
        let sessionAddIn = addIns.find(curAddIn => curAddIn.name == sessions_1.SESSION_ADDIN_NAME);
        if (!sessionAddIn || sessionAddIn.disabled) {
            log.error('Cloudant Session Store AddIn requires the Session Add In which has been disabled. Cloudant Session Store AddIn will be disabled');
            this.disabled = true;
            return;
        }
        if (!this._sessionConfig) {
            log.error('Session configuration missing for Cloudant Store. Cloudant Session Store AddIn will be disabled');
            this.disabled = true;
            return;
        }
        if (!config.get(CloudantStoreConfigNames.CLOUDANT_STORE_OFF) && config.get(sessions_1.SessionConfigNames.SESSION_OFF)) {
            config.required([CloudantStoreConfigNames.CLOUDANT_STORE_OFF]);
        }
        if (!this._cloudantStoreConfig) {
            this._cloudantStoreConfig = {};
        }
        if (!config.get(CloudantStoreConfigNames.CLOUDANT_STORE_INSTANCE_NAME)) {
            config.required([CloudantStoreConfigNames.CLOUDANT_STORE_URL]);
            this._cloudantStoreConfig.url = config.get(CloudantStoreConfigNames.CLOUDANT_STORE_URL);
        }
        else {
            try {
                this._cloudantStoreConfig.instanceName = config.get(CloudantStoreConfigNames.CLOUDANT_STORE_INSTANCE_NAME);
                this._cloudantStoreConfig.vcapServices = JSON.parse(process.env.VCAP_SERVICES);
            }
            catch (e) {
                log.error('Unable to find the Cloudant Store VCAP instance ', config.get(CloudantStoreConfigNames.CLOUDANT_STORE_INSTANCE_NAME));
                log.error('Cloudant Session Store AddIn will be disabled');
                return;
            }
        }
        log.info('Configuring Cloudant Store for Sessions');
        this._sessionConfig.store = new CloudantStore(this._cloudantStoreConfig);
        sessionAddIn.configure(this._sessionConfig);
        if (this._storeCallback)
            this._storeCallback(this._sessionConfig.store, config);
    }
}
exports.cloudantStoreAddIn = new CloudantStoreAddInImpl(exports.CLOUDANT_STORE_ADDIN_NAME, exports.CLOUDANT_STORE_ADDIN_PRIORITY);

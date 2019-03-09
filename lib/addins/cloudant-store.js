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
    cloudantUrl: {
        describe: 'URL for the cludant store (e.g., https://MYUSERNAME:MYPASSWORD@MYACCOUNT.cloudant.com)',
        type: 'string',
        env: 'CLOUDANT_STORE_URL',
        group: GROUP,
        conflicts: 'cloudantInstanceName'
    },
    cloudantInstanceName: {
        describe: 'VCAP Instance Name for cloudant store. For use when deployed on the IBM Cloud (conflicts with cloudantUrl).',
        type: 'string',
        env: 'CLOUDANT_STORE_INSTANCE_NAME',
        group: GROUP
    }
};
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
        if (config.get('noCloudantStore')) {
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
        if (!config.get('noCloudantStore') && config.get('noSession')) {
            config.required(['noCloudantStore']);
        }
        if (!this._cloudantStoreConfig) {
            this._cloudantStoreConfig = {};
        }
        if (!config.get('cloudantInstanceName')) {
            config.required(['cloudantUrl']);
            this._cloudantStoreConfig.url = config.get('cloudantUrl');
        }
        else {
            try {
                this._cloudantStoreConfig.instanceName = config.get('cloudantInstanceName');
                this._cloudantStoreConfig.vcapServices = JSON.parse(process.env.VCAP_SERVICES);
            }
            catch (e) {
                log.error('Unable to find the Cloudant Store VCAP instance ', config.get('cloudantInstanceName'));
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

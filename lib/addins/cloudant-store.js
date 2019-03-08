"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
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
let storeCallback;
let cloudantStoreConfig;
let sessionConfig;
exports.cloudantStoreAddIn = {
    disabled: false,
    priority: 200,
    configure: (sessionOptions, cloudantStoreOptions, storeCB) => {
        if (storeCB)
            storeCallback = storeCB;
        cloudantStoreConfig = cloudantStoreOptions;
        sessionConfig = sessionOptions;
    },
    getOptions: (currentOptions) => options,
    addIn: (server) => {
        const log = server.getLogger('cloudantStoreAddIn');
        const config = server.getConfig();
        if (config.get('noCloudantStore')) {
            log.debug('Cloudant Session Store AddIn disabled');
            return;
        }
        if (sessions_1.sessionAddIn.disabled) {
            log.error('Cloudant Session Store AddIn requires the Session Add In which has been disabled.');
        }
        if (!config.get('noCloudantStore') && config.get('noSession')) {
            config.required(['noCloudantStore']);
        }
        if (!cloudantStoreConfig) {
            cloudantStoreConfig = {};
        }
        if (!config.get('cloudantInstanceName')) {
            config.required(['cloudantUrl']);
            cloudantStoreConfig.url = config.get('cloudantUrl');
        }
        else {
            try {
                cloudantStoreConfig.instanceName = config.get('cloudantInstanceName');
                cloudantStoreConfig.vcapServices = JSON.parse(process.env.VCAP_SERVICES);
            }
            catch (e) {
                log.error('Unable to find the Cloudant Store VCAP instance ', config.get('cloudantInstanceName'));
                log.error('Cloudant Session Store AddIn will be disabled');
                return;
            }
        }
        if (!sessionConfig) {
            log.error('Session configuration missing for Cloudant Store. Cloudant Session Store AddIn will be disabled');
            return;
        }
        sessionConfig.store = new CloudantStore(cloudantStoreConfig);
        sessions_1.sessionAddIn.configure(sessionConfig);
        if (storeCallback)
            storeCallback(express_session_1.default.Store);
    }
};

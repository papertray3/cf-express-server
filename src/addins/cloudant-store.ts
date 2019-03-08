import session, { SessionOptions } from 'express-session';

import { AddIn, CliOptions, CFExpressServer } from '../index';
import { sessionAddIn } from './sessions';

const CloudantStore = require('connect-cloudant-store')(session);

export type StoreCreationCallback = (store : any) => void;
export interface CloudantStoreAddIn extends AddIn {
    configure(sessionOptions : SessionOptions, cloudantStoreOptions? : any, storeCB? : StoreCreationCallback) : void;
}

const GROUP = 'Server Options';

const options : CliOptions = {
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
}

let storeCallback : StoreCreationCallback;
let cloudantStoreConfig : any;
let sessionConfig : SessionOptions;

export const cloudantStoreAddIn : CloudantStoreAddIn = {
    disabled: false,
    priority: 200,
    configure: (sessionOptions : SessionOptions, cloudantStoreOptions? : any, storeCB? : StoreCreationCallback) => {
        if (storeCB)
            storeCallback = storeCB;

        cloudantStoreConfig = cloudantStoreOptions;
        sessionConfig = sessionOptions;
    },
    getOptions: (currentOptions : CliOptions) => options,
    addIn: (server : CFExpressServer) => {
        const log = server.getLogger('cloudantStoreAddIn');
        const config = server.getConfig();

        if (config.get('noCloudantStore')) {
            log.debug('Cloudant Session Store AddIn disabled');
            return;
        }

        if (sessionAddIn.disabled) {
            log.error('Cloudant Session Store AddIn requires the Session Add In which has been disabled.');
        }

        if (!config.get('noCloudantStore') && config.get('noSession')) {
            config.required(['noCloudantStore']);
        }

        if (!cloudantStoreConfig) {
            cloudantStoreConfig = {}
        }

        if (!config.get('cloudantInstanceName')) {
            config.required(['cloudantUrl'])
            cloudantStoreConfig.url = config.get('cloudantUrl');
        } else {
            try {
                cloudantStoreConfig.instanceName = config.get('cloudantInstanceName');
                cloudantStoreConfig.vcapServices = JSON.parse(process.env.VCAP_SERVICES as string);
            } catch (e) {
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
        sessionAddIn.configure(sessionConfig);

        if (storeCallback)
            storeCallback(session.Store);
    }
}
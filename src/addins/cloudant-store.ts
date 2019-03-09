import session, { SessionOptions } from 'express-session';
import nconf from 'nconf';

import { AddIn, CliOptions, CFExpressServer, BasicAddIn } from '../index';
import { SESSION_ADDIN_NAME, SessionAddIn } from './sessions';

const CloudantStore = require('connect-cloudant-store')(session);

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

export const CLOUDANT_STORE_ADDIN_NAME = 'cloudantStoreAddIn';
export const CLOUDANT_STORE_ADDIN_PRIORITY = 200;
export type StoreCreationCallback = (store : any, config : typeof nconf) => void;
export interface CloudantStoreAddIn extends AddIn {
    configure(sessionOptions : SessionOptions, cloudantStoreOptions? : any, storeCB? : StoreCreationCallback) : void;
}

class CloudantStoreAddInImpl extends BasicAddIn implements CloudantStoreAddIn {

    protected _storeCallback : StoreCreationCallback | undefined;
    protected _cloudantStoreConfig : any | undefined;
    protected _sessionConfig : SessionOptions | undefined;

    configure(sessionOptions: session.SessionOptions, cloudantStoreOptions?: any, storeCB?: StoreCreationCallback | undefined): void {
        if (storeCB)
            this._storeCallback = storeCB;

        this._cloudantStoreConfig = cloudantStoreOptions;
        this._sessionConfig = sessionOptions;
    }

    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }    
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        const log = server.getLogger(this.name);
        const config = server.getConfig();

        if (config.get('noCloudantStore')) {
            log.debug('Cloudant Session Store AddIn disabled');
            return;
        }

        let sessionAddIn = addIns.find(curAddIn => curAddIn.name == SESSION_ADDIN_NAME);
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
            this._cloudantStoreConfig = {}
        }

        if (!config.get('cloudantInstanceName')) {
            config.required(['cloudantUrl'])
            this._cloudantStoreConfig.url = config.get('cloudantUrl');
        } else {
            try {
                this._cloudantStoreConfig.instanceName = config.get('cloudantInstanceName');
                this._cloudantStoreConfig.vcapServices = JSON.parse(process.env.VCAP_SERVICES as string);
            } catch (e) {
                log.error('Unable to find the Cloudant Store VCAP instance ', config.get('cloudantInstanceName'));
                log.error('Cloudant Session Store AddIn will be disabled');
                return;
            }
        }

        log.info('Configuring Cloudant Store for Sessions');
        this._sessionConfig.store = new CloudantStore(this._cloudantStoreConfig);
        (<SessionAddIn>sessionAddIn).configure(this._sessionConfig);

        if (this._storeCallback)
            this._storeCallback(this._sessionConfig.store, config);
    }


}

export const cloudantStoreAddIn : CloudantStoreAddIn = new CloudantStoreAddInImpl(CLOUDANT_STORE_ADDIN_NAME, CLOUDANT_STORE_ADDIN_PRIORITY);

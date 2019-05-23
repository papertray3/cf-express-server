import { injectable, inject, optional } from 'inversify';
import { interfaces } from '../interfaces';
import { SessionMiddlewareComponent, SessionMiddlewareComponentBindingNames } from './session-component';
import session from 'express-session';
import { ContainerBindingNames } from '../context';
import { Config, CliOptions, CommonConfigNames } from '@papertray3/cf-express-config';

const CloudantStore = require('connect-cloudant-store')(session);

export class CloudantSessionMiddlewareComponentBindingNames {
    static readonly ID : string = "CloudantSessionComponent";
    static readonly CONFIG : string = SessionMiddlewareComponentBindingNames.CONFIG;
    static readonly CLOUDANT_CONFIG : string = "CloudantSessionConfig";
    static readonly STORE_LISTENERS : string = "CloudantStoreListeners";
}

export class CloudantStoreConfigNames {
    static readonly URL : string = 'cloudantStoreURL';
    static readonly INSTANCE_NAME : string = 'cloudantStoreInstanceName';

    static readonly OPTION_GROUP : string = 'Session Store Options';
}

export interface OnCloudantSessionStoreEvents {
    connect?: () => void,
    disconnect?: () => void,
    error?: (err : Error) => void
}

export interface CloudantStoreConfigOptions {
    client? : unknown,
    database? : string,
    prefix? : string,
    ttl? : number,
    disableTTLRefresh? : boolean,
    dbViewName? : string,
    dbDesignName? : string,
    dbRemoveExpMax? : number,
    url? : string,
    instanceName? : string,
    vcapServices? : string
}

export class NoCloudantClientError implements Error {
    name: string;    
    stack?: string | undefined;

    constructor(public message : string, public config? : CloudantStoreConfigOptions) { 
        this.name = NoCloudantClientError.name;
    }
}


@injectable()
export class CloudantSessionMiddlewareComponent extends SessionMiddlewareComponent {

    constructor(@inject(CloudantSessionMiddlewareComponentBindingNames.CONFIG) @optional() sessionConfig : session.SessionOptions,
        @inject(CloudantSessionMiddlewareComponentBindingNames.CLOUDANT_CONFIG) @optional() protected _cloudantConfig : CloudantStoreConfigOptions,
        @inject(CloudantSessionMiddlewareComponentBindingNames.STORE_LISTENERS) @optional() protected _listeners : OnCloudantSessionStoreEvents,
        @inject(ContainerBindingNames.CONFIG) protected _config : Config
    ) {
        super(sessionConfig);
        if (!this._cloudantConfig) this._cloudantConfig = {};

        if (this._config.get(CloudantStoreConfigNames.URL)) {
            this._cloudantConfig.url = this._config.get(CloudantStoreConfigNames.URL);
        } else if (this._config.get(CloudantStoreConfigNames.INSTANCE_NAME)) {
            this._cloudantConfig.instanceName = this._config.get(CloudantStoreConfigNames.INSTANCE_NAME);
            this._cloudantConfig.vcapServices = this._config.get(CommonConfigNames.SERVICES);
        } else if (!this._cloudantConfig.client) {
            throw new NoCloudantClientError('No valid client options (URL, Instance Name, or Client) exist to create a valid Cloudant Store', this._cloudantConfig);
        }

        let store = new CloudantStore(this._cloudantConfig);
        this._sessionConfig.store = store;

        if (this._listeners) {
            if (this._listeners.connect) store.on('connect', this._listeners.connect);
            if (this._listeners.disconnect) store.on('disconnect', this._listeners.disconnect);
            if (this._listeners.error) store.on('error', this._listeners.error);
        }
    }

}

const options : CliOptions = {};
options[CloudantStoreConfigNames.URL] = {
    group: CloudantStoreConfigNames.OPTION_GROUP,
    describe: 'URL for the Cloudant Store, e.g. https://user:password@host:port',
    type: 'string',
    env: 'CLOUDANT_STORE_URL'
}

options[CloudantStoreConfigNames.INSTANCE_NAME] = {
    group: CloudantStoreConfigNames.OPTION_GROUP,
    describe: 'Instance (service) name for the cloudant store found in the VCAP Services description, usually provided by cloud foundry.',
    type: 'string',
    env: 'CLOUDANT_STORE_INSTANCE_NAME',
    conflicts: CloudantStoreConfigNames.URL
}

export const cloudantSessionMiddlewareComponentDescriptor : interfaces.MiddlewareComponentDescriptor = {
    id: CloudantSessionMiddlewareComponentBindingNames.ID,
    component: CloudantSessionMiddlewareComponent,
    options: options
}
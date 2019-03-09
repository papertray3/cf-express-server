import { SessionOptions } from 'express-session';
import { AddIn, Config } from '../index';
export declare enum CloudantStoreConfigNames {
    CLOUDANT_STORE_OFF = "noCloudantStore",
    CLOUDANT_STORE_URL = "cloudantStoreUrl",
    CLOUDANT_STORE_INSTANCE_NAME = "cloudantStoreInstanceName"
}
export declare const CLOUDANT_STORE_ADDIN_NAME = "cloudantStoreAddIn";
export declare const CLOUDANT_STORE_ADDIN_PRIORITY = 200;
export declare type StoreCreationCallback = (store: any, config: Config) => void;
export interface CloudantStoreAddIn extends AddIn {
    configure(sessionOptions: SessionOptions, cloudantStoreOptions?: any, storeCB?: StoreCreationCallback): void;
}
export declare const cloudantStoreAddIn: CloudantStoreAddIn;

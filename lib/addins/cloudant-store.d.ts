import { SessionOptions } from 'express-session';
import { AddIn, Config } from '../index';
export declare const CLOUDANT_STORE_ADDIN_NAME = "cloudantStoreAddIn";
export declare const CLOUDANT_STORE_ADDIN_PRIORITY = 200;
export declare type StoreCreationCallback = (store: any, config: Config) => void;
export interface CloudantStoreAddIn extends AddIn {
    configure(sessionOptions: SessionOptions, cloudantStoreOptions?: any, storeCB?: StoreCreationCallback): void;
}
export declare const cloudantStoreAddIn: CloudantStoreAddIn;

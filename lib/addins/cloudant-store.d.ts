import { SessionOptions } from 'express-session';
import { AddIn } from '../index';
export declare type StoreCreationCallback = (store: any) => void;
export interface CloudantStoreAddIn extends AddIn {
    configure(sessionOptions: SessionOptions, cloudantStoreOptions?: any, storeCB?: StoreCreationCallback): void;
}
export declare const cloudantStoreAddIn: CloudantStoreAddIn;

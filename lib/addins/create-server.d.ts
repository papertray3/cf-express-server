import { AddIn } from '../index';
export declare enum ServerConfigNames {
    SERVER_PROTOCOL = "protocol",
    SERVER_NO_SSL = "noSSL",
    SERVER_CA_FILE = "sslCAFile",
    SERVER_CERT_FILE = "sslCertFile",
    SERVER_KEY_FILE = "sslKeyFile"
}
export declare const SERVER_ADDIN_NAME = "serverAddIn";
export declare const SERVER_ADDIN_PRIORITY = 10000;
export declare const serverAddIn: AddIn;

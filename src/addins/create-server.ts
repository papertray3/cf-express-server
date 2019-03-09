import { basename } from 'path';

import { AddIn, CliOptions, CFExpressServer, BasicAddIn, CommonConfigNames } from '../index';
import { readFileSync } from 'fs';
import { createServer as createHTTPSServer } from 'https';
import { createServer, Server } from 'http';

const GROUP = 'Security Options'

const options: CliOptions = {
    protocol: {
        choices: ['http', 'https'],
        type: 'string',
        env: 'PROTOCOL',
        group: GROUP
    },
    noSSL: {
        describe: 'Turns off SSL even if protocol is https (server will be over http regardless). However, tls will never be used if protocol is http.',
        type: 'boolean',
        default: undefined,
        env: 'NO_SSL',
        group: GROUP
    },
    sslCAFile: {
        describe: 'Path to the certificate authority chain file (in PEM format, env: SSL_CA_FILE)',
        type: 'string',
        normalize: true,
        env: 'SSL_CA_FILE',
        group: GROUP
    },
    sslCertFile: {
        describe: 'Path to the certificate file (in PEM format, env: SSL_CERT_FILE)',
        type: 'string',
        normalize: true,
        env: 'SSL_CERT_FILE',
        group: GROUP
    },
    sslKeyFile: {
        describe: 'Path to the certificate key file (in PEM format, env: SSL_KEY_FILE)',
        type: 'string',
        normalize: true,
        env: 'SSL_KEY_FILE',
        group: GROUP
    }
}

export enum ServerConfigNames {
    SERVER_PROTOCOL = 'protocol',
    SERVER_NO_SSL = 'noSSL',
    SERVER_CA_FILE = 'sslCAFile',
    SERVER_CERT_FILE = 'sslCertFile',
    SERVER_KEY_FILE = 'sslKeyFile'
}

export const SERVER_ADDIN_NAME = 'serverAddIn';
export const SERVER_ADDIN_PRIORITY = 10000;

class ServerAddInImpl extends BasicAddIn {
    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }    
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        let name = this.name;
        server.start = (listener?: Function) => {
            const log = server.getLogger(name);
            const config = server.getConfig();
            const port = config.get(CommonConfigNames.PORT);

            if (!(config.get(ServerConfigNames.SERVER_NO_SSL)) && config.get(ServerConfigNames.SERVER_PROTOCOL) === 'https') {
                config.required([ServerConfigNames.SERVER_CA_FILE, ServerConfigNames.SERVER_CERT_FILE, ServerConfigNames.SERVER_KEY_FILE]);

                try {
                    let options: any = {
                        key: readFileSync(config.get(ServerConfigNames.SERVER_KEY_FILE)),
                        cert: readFileSync(config.get(ServerConfigNames.SERVER_CERT_FILE)),
                        ca: readFileSync(config.get(ServerConfigNames.SERVER_CA_FILE))
                    }

                    return createHTTPSServer(options, server).listen(port, () => {
                        log.info('Starting HTTPS Server...');
                        if (listener)
                            listener();
                    });

                } catch (e) {
                    log.fatal('Failed to load certificate files for SSL');
                    throw e;
                }
            }

            return createServer(server).listen(port, () => {
                log.info('Starting HTTP Server...');
                if (listener)
                    listener();
            });
        }
    }


}


export const serverAddIn: AddIn = new ServerAddInImpl(SERVER_ADDIN_NAME, SERVER_ADDIN_PRIORITY);

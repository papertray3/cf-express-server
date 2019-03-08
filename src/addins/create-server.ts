import { basename } from 'path';

import { AddIn, CliOptions, CFExpressServer } from '../index';
import { readFileSync } from 'fs';
import { createServer as createHTTPSServer } from 'https';
import { createServer } from 'http';

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


export const serverAddIn: AddIn = {
    disabled: false,
    priority: 10000,
    getOptions: (currentOptions: CliOptions) => {
        return options;
    },
    addIn: (app: CFExpressServer) => {

        app.start = (listener?: Function) => {
            const log = app.getLogger('serverAddIn');
            const config = app.getConfig();
            const port = config.get('port');

            if (!(config.get('noSSL')) && config.get('protocol') === 'https') {
                config.required(['sslCAFile', 'sslCertFile', 'sslKeyFile']);

                try {
                    let options: any = {
                        key: readFileSync(config.get('sslKeyFile')),
                        cert: readFileSync(config.get('sslCertFile')),
                        ca: readFileSync(config.get('sslCAFile'))
                    }

                    return createHTTPSServer(options, app).listen(port, () => {
                        log.info('Starting HTTPS Server...');
                        if (listener)
                            listener();
                    });

                } catch (e) {
                    log.fatal('Failed to load certificate files for SSL');
                    throw e;
                }
            }

            return createServer(app).listen(port, () => {
                log.info('Starting HTTP Server...');
                if (listener)
                    listener();
            });
        }
    }
}
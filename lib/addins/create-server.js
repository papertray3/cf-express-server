"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const https_1 = require("https");
const http_1 = require("http");
const GROUP = 'Security Options';
const options = {
    protocol: {
        choices: ['http', 'https'],
        type: 'string',
        group: GROUP
    },
    noSSL: {
        describe: 'Turns off SSL even if protocol is https (server will be over http regardless). However, tls will never be used if protocol is http.',
        type: 'boolean',
        default: undefined,
        group: GROUP
    },
    sslCAFile: {
        describe: 'Path to the certificate authority chain file (in PEM format, env: SSL_CA_FILE)',
        type: 'string',
        normalize: true,
        group: GROUP
    },
    sslCertFile: {
        describe: 'Path to the certificate file (in PEM format, env: SSL_CERT_FILE)',
        type: 'string',
        normalize: true,
        group: GROUP
    },
    sslKeyFile: {
        describe: 'Path to the certificate key file (in PEM format, env: SSL_KEY_FILE)',
        type: 'string',
        normalize: true,
        group: GROUP
    }
};
exports.ServerAddIn = {
    priority: 10000,
    getOptions: (currentOptions) => {
        return options;
    },
    addIn: (app) => {
        app.start = (listener) => {
            const log = app.getLogger('ServerAddIn');
            const config = app.getConfig();
            const port = config.get('port');
            if (!(config.get('noSSL')) && config.get('protocol') === 'https') {
                config.required(['sslCAFile', 'sslCertFile', 'sslKeyFile']);
                try {
                    let options = {
                        key: fs_1.readFileSync(config.get('sslKeyFile')),
                        cert: fs_1.readFileSync(config.get('sslCertFile')),
                        ca: fs_1.readFileSync(config.get('sslCAFile'))
                    };
                    return https_1.createServer(options, app).listen(port, () => {
                        log.info('Starting HTTPS Server...');
                        if (listener)
                            listener();
                    });
                }
                catch (e) {
                    log.fatal('Failed to load certificate files for SSL');
                    throw e;
                }
            }
            return http_1.createServer(app).listen(port, () => {
                log.info('Starting HTTP Server...');
                if (listener)
                    listener();
            });
        };
    }
};

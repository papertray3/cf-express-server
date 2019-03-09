"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const fs_1 = require("fs");
const https_1 = require("https");
const http_1 = require("http");
const GROUP = 'Security Options';
const options = {
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
};
exports.SERVER_ADDIN_NAME = 'serverAddIn';
exports.SERVER_ADDIN_PRIORITY = 10000;
class ServerAddInImpl extends index_1.BasicAddIn {
    getOptions(currentOptions, addIns) {
        return options;
    }
    addIn(server, addIns) {
        let name = this.name;
        server.start = (listener) => {
            const log = server.getLogger(name);
            const config = server.getConfig();
            const port = config.get('port');
            if (!(config.get('noSSL')) && config.get('protocol') === 'https') {
                config.required(['sslCAFile', 'sslCertFile', 'sslKeyFile']);
                try {
                    let options = {
                        key: fs_1.readFileSync(config.get('sslKeyFile')),
                        cert: fs_1.readFileSync(config.get('sslCertFile')),
                        ca: fs_1.readFileSync(config.get('sslCAFile'))
                    };
                    return https_1.createServer(options, server).listen(port, () => {
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
            return http_1.createServer(server).listen(port, () => {
                log.info('Starting HTTP Server...');
                if (listener)
                    listener();
            });
        };
    }
}
exports.serverAddIn = new ServerAddInImpl(exports.SERVER_ADDIN_NAME, exports.SERVER_ADDIN_PRIORITY);

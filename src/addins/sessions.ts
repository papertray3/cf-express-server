import session, { SessionOptions } from 'express-session';
import passport from 'passport';

import { AddIn, CliOptions, CFExpressServer } from '../index';
import { appIdAddIn } from './appid-webstrategy';

export interface SessionAddIn extends AddIn {
    configure(options: SessionOptions): void;
}

const options: CliOptions = {
    noSession: {
        describe: 'Turn off session middleware (https://www.npmjs.com/package/express-session)',
        type: 'boolean',
        default: undefined,
        env: 'NO_SESSION',
        group: 'Server Options'
    }
}

let sessionConfig : SessionOptions = {
        secret: 'random stuff',
        resave: false,
        saveUninitialized: true
      };

let defaultConfig = true;

export const sessionAddIn : SessionAddIn = {
    disabled: false,
    priority: 250,
    getOptions: (currentOptions : CliOptions) => options,
    configure: (options : SessionOptions) => {
        sessionConfig = options;
        defaultConfig = false;
    },
    addIn: (server : CFExpressServer) => {
        const log = server.getLogger('sessionAddIn');
        const config = server.getConfig();

        if (config.get('noSession')) {
            log.debug('Session AddIn disabled');
            if (!appIdAddIn.disabled) {
                config.required(['noSignOn']);
            }
            return;
        }

        server.use(passport.initialize());

        log.info('Configuring sessions');
        server.use(session(sessionConfig));
        if (defaultConfig) {
            log.info('Using default configuration for sessions. Consider configuring a session store.');
        }
    }
}
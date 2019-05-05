import session, { SessionOptions } from 'express-session';
import { AddIn, CFExpressServer, BasicAddIn } from '../index';
import { CliOptions } from '@papertray3/cf-express-config';



const options: CliOptions = {
    noSession: {
        describe: 'Turn off session middleware (https://www.npmjs.com/package/express-session)',
        type: 'boolean',
        default: undefined,
        env: 'NO_SESSION',
        group: 'Server Options'
    }
}

export enum SessionConfigNames {
    SESSION_OFF = 'noSession'
}

export const SESSION_ADDIN_NAME = 'sessionAddIn';
export const SESSION_ADDIN_PRIORITY = 250;

export interface SessionAddIn extends AddIn {
    configure(options: SessionOptions): void;
}

class SessionAddInImpl extends BasicAddIn implements SessionAddIn {

    protected _sessionConfig : SessionOptions = {
        secret: 'random stuff',
        resave: false,
        saveUninitialized: true
      };

    protected _defaultConfig = true;   

    configure(options: session.SessionOptions): void {
        this._sessionConfig = options;
        this._defaultConfig = false;
    }
    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }    
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        const log = server.getLogger(this.name);
        const config = server.getConfig();

        if (config.get(SessionConfigNames.SESSION_OFF)) {
            log.debug('Session AddIn disabled...');
            return;
        }

        log.info('Configuring sessions');
        server.use(session(this._sessionConfig));
        if (this._defaultConfig) {
            log.warn('Using default configuration for sessions. Consider configuring a session store.');
        }
    }


}

export const sessionAddIn : SessionAddIn = new SessionAddInImpl(SESSION_ADDIN_NAME, SESSION_ADDIN_PRIORITY);
import helmet, { IHelmetConfiguration } from 'helmet';

import { AddIn, CliOptions, CFExpressServer } from '../index';

export interface HelmetAddIn extends AddIn {
    configure(options: IHelmetConfiguration): void;
}

const options: CliOptions = {
    noHelmet: {
        describe: 'Turn off helmet middleware (https://www.npmjs.com/package/helmet)',
        type: 'boolean',
        default: undefined,
        env: 'NO_HELMET',
        group: 'Server Options'
    }
}


let helmetConfig : IHelmetConfiguration;
export const helmetAddIn: HelmetAddIn = {
    disabled: false,
    priority: 110,
    configure: (options: IHelmetConfiguration): void => { helmetConfig = options; },
    getOptions: (currentOptions : CliOptions) => { return options; },
    addIn: (server : CFExpressServer) => { 
        const log = server.getLogger('helmetAddIn');
        const config = server.getConfig();

        if (config.get('noHelmet')) {
            log.debug('Helmet AddIn disabled');
            return;
        }
        
        log.info('Configuring helmet');
        if (!helmetConfig)
            log.info('Using default configuration');
        server.use(helmet(helmetConfig));
    }
}
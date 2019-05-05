import helmet, { IHelmetConfiguration } from 'helmet';
import { AddIn, CFExpressServer, BasicAddIn } from '../index';
import { CliOptions } from '@papertray3/cf-express-config';

const options: CliOptions = {
    noHelmet: {
        describe: 'Turn off helmet middleware (https://www.npmjs.com/package/helmet)',
        type: 'boolean',
        default: undefined,
        env: 'NO_HELMET',
        group: 'Server Options'
    }
}
export enum HelmetConfigNames {
    HELMET_OFF = 'noHelmet'
}

export const HELMET_ADDIN_NAME = 'helmetAddIn';
export const HELMET_ADDIN_PRIORITY = 110;

export interface HelmetAddIn extends AddIn {
    configure(options: IHelmetConfiguration): void;
}

class HelmetAddInImpl extends BasicAddIn implements HelmetAddIn {

    protected _helmetConfig : IHelmetConfiguration | undefined;

    configure(options: helmet.IHelmetConfiguration): void {
        this._helmetConfig = options;
    }

    getOptions(currentOptions: CliOptions, addIns: AddIn[]): CliOptions | null {
        return options;
    }   
    
    addIn(server: CFExpressServer, addIns: AddIn[]): void {
        const log = server.getLogger(this.name);
        const config = server.getConfig();

        if (config.get(HelmetConfigNames.HELMET_OFF)) {
            log.info('Helmet AddIn disabled');
            return;
        }
        
        log.info('Configuring helmet');
        if (!this._helmetConfig)
            log.debug('Using default configuration');

        server.use(helmet(this._helmetConfig));
    }


}


export const helmetAddIn: HelmetAddIn = new HelmetAddInImpl(HELMET_ADDIN_NAME, HELMET_ADDIN_PRIORITY);
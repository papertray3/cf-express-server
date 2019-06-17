import { interfaces } from '../interfaces';
import { MiddlewareContainer, ContainerBindingNames } from '../context';
import { configure, CliOptions, ConfigOptions, Config, CommonConfigNames } from '@papertray3/cf-express-config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'net';

export class Application implements interfaces.Application {

    public readonly handler : express.Express;
    public readonly server : Server;

    public readonly config : Config;
    

    constructor(private _container : MiddlewareContainer) {
        this.config = this.configure();
        this.handler = express();
        this.server = this._container.isBound(ContainerBindingNames.SERVER) ?
            this._container.get<interfaces.ServerComponent>(ContainerBindingNames.SERVER).createServer(this.handler) :
            createServer(this.handler);

        for(let component of this._container) {
            this.installMiddleware(component);
        }
    }

    protected configure() : Config {
        let cliOptions : CliOptions = {}
        this._container.getAll<CliOptions>(ContainerBindingNames.CLI_OPTIONS).forEach(options => {
            cliOptions = Object.assign(cliOptions, options);
        });

        let config = configure(cliOptions);
        this._container.bind<Config>(ContainerBindingNames.CONFIG).toConstantValue(config);

        return config;
    }

    protected installMiddleware(middleware : interfaces.MiddlewareComponent) {
        middleware.install(this);
    }

    start(listener? : () => void): void {
        let port = this.config.get(CommonConfigNames.PORT);
        this.server.listen(port, () => {
            if (listener) listener();
        }); 
    }    
    
    stop(): void {
        this.server.close();
    }


}
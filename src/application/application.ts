import { interfaces } from '../interfaces';
import { MiddlewareContainer, ContainerBindingNames } from '../context';
import { configure, CliOptions, ConfigOptions, Config, CommonConfigNames } from '@papertray3/cf-express-config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'net';

export class Application implements interfaces.Application {

    protected readonly app : express.Express;
    protected readonly server : Server;

    public readonly config : Config;
    

    constructor(private _container : MiddlewareContainer) {
        this.config = this.configure();
        this.app = express();
        this.server = this._container.isBound(ContainerBindingNames.SERVER) ?
            this._container.get<interfaces.ServerComponent>(ContainerBindingNames.SERVER).createServer(this.app) :
            createServer(this.app);

        for(let component of this._container) {
            this.installMiddleware(component);
        }
    }

    protected configure() : Config {
        let configOptions : ConfigOptions = this._container.isBound(ContainerBindingNames.CONFIG_OPTIONS) ? 
            this._container.get<ConfigOptions>(ContainerBindingNames.CONFIG_OPTIONS) : 
            { };

        let cliOptions : CliOptions = {}
        this._container.getAll<CliOptions>(ContainerBindingNames.CLI_OPTIONS).forEach(options => {
            cliOptions = Object.assign(cliOptions, options);
        });

        let config = configure(configOptions, cliOptions);
        this._container.bind<Config>(ContainerBindingNames.CONFIG).toConstantValue(config);

        return config;
    }

    protected installMiddleware(middleware : interfaces.MiddlewareComponent) {
        middleware.install(this.app);
    }

    start(listener? : () => void): void {
        let port = this.config.get(CommonConfigNames.PORT);
        this.server.listen(port, () => {
            if (listener) listener();
        }); 
    }    
    
    stop(): void {
        throw new Error("Method not implemented.");
    }


}
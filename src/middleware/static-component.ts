import { injectable, inject, optional } from 'inversify';
import { interfaces } from '../interfaces';
import express, { Request, Response } from 'express';
import { CliOptions, Config } from '@papertray3/cf-express-config';
import { join, resolve } from 'path';
import { ContainerBindingNames } from '../context';
import { existsSync, lstatSync } from 'fs';

export class StaticMiddlewareComponentBindingNames {
    static readonly ID : string = "StaticComponent";
    static readonly CONFIG : string = "StaticConfig";
}

export class StaticMiddlewareCliOptons {
    static readonly ROOT_DIR = 'rootDir';
}

@injectable()
export class StaticMiddlewareComponent implements interfaces.MiddlewareComponent {
    constructor(@inject(ContainerBindingNames.CONFIG) protected _config : Config){ }

    install(app : interfaces.Express) : void {
        const contentPath = resolve(this._config.get(StaticMiddlewareCliOptons.ROOT_DIR));

        if (existsSync(contentPath) && lstatSync(contentPath).isDirectory()) {
            //log.info(`Attempting to serve ${contentPath}`);
            app.use(express.static(contentPath));
            app.get('*', (req: Request, res : Response) => {
                res.sendFile(join(contentPath, 'index.html'));
            });
        } else {
            console.log('Nothing to serve');
            //log.warn('No directory to serve...');
        }

    }
}

const options : CliOptions = {};
options[StaticMiddlewareCliOptons.ROOT_DIR] = {
    describe: 'Root directory to serve',
    type: 'string',
    normalize: true,
    env: 'ROOT_DIR',
    confDefault: join(__dirname, '..', 'public')
}

export const staticMiddlewareComponentDescriptor : interfaces.MiddlewareComponentDescriptor = {
    id: StaticMiddlewareComponentBindingNames.ID,
    component: StaticMiddlewareComponent,
    options: options
}
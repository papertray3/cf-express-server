import { CliOptions, CliOption, Config, ConfigOptions } from '@papertray3/cf-express-config';
import { interfaces as inversifyInterfaces } from 'inversify/dts/interfaces/interfaces';
import express from 'express';
import { Server } from 'net';
import { RequestListener } from 'http';

namespace interfaces {
    export type Express = express.Express;
    export interface MiddlewareComponent {
        install(app : Application) : void;
    }

    export interface ServerComponent {
        createServer(listener : RequestListener) : Server;
    }

    export type NewableMiddlewareComponent = inversifyInterfaces.Newable<MiddlewareComponent>;
    export type NewableServerComponent = inversifyInterfaces.Newable<ServerComponent>;
    export type ServerFactory = () => Server;
    export type MiddlewareComponentID = inversifyInterfaces.ServiceIdentifier<MiddlewareComponent>;
    export type MiddlewareIterator = IterableIterator<MiddlewareComponent>;
    export type MiddlewareComponentSequence = IterableIterator<MiddlewareComponentID>;

    export interface MiddlewareComponentSequenceIterator extends IterableIterator<MiddlewareComponentID> {
        get(id: interfaces.MiddlewareComponentID) : MiddlewareComponentDescriptor | undefined;
    }

    export interface MiddlewareComponentDescriptor {
        id: MiddlewareComponentID,
        component: NewableMiddlewareComponent,
        options?: CliOptions
    }

    export type MiddlewareSequenceElement = NewableMiddlewareComponent | MiddlewareComponentDescriptor;

    export function isMiddlewareComponentDescriptor(element : MiddlewareSequenceElement) : element is MiddlewareComponentDescriptor {
        return (element as MiddlewareComponentDescriptor).id !== undefined;
    }

    export type MiddlewareSequenceArray = Array<MiddlewareSequenceElement>;

    export interface MiddlewareContainer extends IterableIterator<MiddlewareComponent> {

        setServer(server : NewableServerComponent) : void;
        addCliOptions(options: CliOptions) : void;

        registerMiddleware(component : NewableMiddlewareComponent) : void;
        registerMiddleware(serviceIdentifier: MiddlewareComponentID, component : NewableMiddlewareComponent, options? : CliOptions) : void;
        registerMiddleware(componentDescriptor: MiddlewareComponentDescriptor) : void;
        registerMiddleware(components : MiddlewareSequenceArray) : void;
    }

    export interface Application {
        
        readonly handler : express.Express;
        readonly server : Server;
        readonly config : Config;

        start(listener? : () => void): void;
        stop() : void;
    }    
}

export { interfaces };
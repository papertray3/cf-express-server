import { interfaces } from '../interfaces';
import { Container, interfaces as inversifyInterfaces } from 'inversify';
import { ConfigOptions, CliOptions } from '@papertray3/cf-express-config';
import { Server } from 'net';

export class ContainerBindingNames {
    static readonly CONFIG_OPTIONS: string = "ConfigOptions";
    static readonly CLI_OPTIONS: string = "CliOptions";
    static readonly CONFIG: string = "Config";
    static readonly SERVER: string = "Server";
}

export class MiddlewareContainer extends Container implements interfaces.MiddlewareContainer {

    private _idx: number = 0;
    private _order: Array<interfaces.MiddlewareComponentID>;

    constructor(sequence: interfaces.MiddlewareComponentSequence | Array<interfaces.MiddlewareComponentID>, options: inversifyInterfaces.ContainerOptions = { defaultScope: "Singleton"}) {
        super(options);
        this._order = Array.isArray(sequence) ?
            this._order = sequence.slice() :
            this._order = Array.from(sequence);
    }

    setServer(server: interfaces.NewableServerComponent) {
        this.isBound(ContainerBindingNames.SERVER) ?
            this.rebind<interfaces.ServerComponent>(ContainerBindingNames.SERVER).to(server) :
            this.bind<interfaces.ServerComponent>(ContainerBindingNames.SERVER).to(server);
    }

    //convenience function for setting the config Options
    setConfigOptions(configOptions: ConfigOptions): void {
        let binding = this.isBound(ContainerBindingNames.CONFIG_OPTIONS) ?
            this.rebind<ConfigOptions>(ContainerBindingNames.CONFIG_OPTIONS) :
            this.bind<ConfigOptions>(ContainerBindingNames.CONFIG_OPTIONS);

        binding.toConstantValue(configOptions);
    }

    addCliOptions(options: CliOptions): void {
        this.bind<CliOptions>(ContainerBindingNames.CLI_OPTIONS).toConstantValue(options);
    }


    //convenience function for binding middleware
    registerMiddleware(component: interfaces.NewableMiddlewareComponent): void;
    registerMiddleware(serviceIdentifier: interfaces.MiddlewareComponentID, component: interfaces.NewableMiddlewareComponent, options?: CliOptions): void;
    registerMiddleware(componentDescriptor: interfaces.MiddlewareComponentDescriptor): void;
    registerMiddleware(components: interfaces.MiddlewareSequenceArray): void;
    registerMiddleware(paramOne: interfaces.MiddlewareComponentID | interfaces.MiddlewareComponentDescriptor | interfaces.MiddlewareSequenceArray, component?: interfaces.NewableMiddlewareComponent, options?: CliOptions): void {
        if (Array.isArray(paramOne)) {
            paramOne.forEach(element => {
                if (interfaces.isMiddlewareComponentDescriptor(element)) {
                    this._registerMiddleware(element.id, element.component, element.options);
                }
            });
        } else if (interfaces.isMiddlewareComponentDescriptor(paramOne as interfaces.MiddlewareComponentDescriptor)) {
            let element = paramOne as interfaces.MiddlewareComponentDescriptor;
            this._registerMiddleware(element.id, element.component, element.options);
        } else if (component) {
            this._registerMiddleware(paramOne as interfaces.MiddlewareComponentID, component, options);
        } else {
            let element = paramOne as interfaces.NewableMiddlewareComponent;
            this._registerMiddleware(element.name, element);
        }
    }

    private _registerMiddleware(id: interfaces.MiddlewareComponentID, component: interfaces.NewableMiddlewareComponent, options?: CliOptions): void {
        this.bind<interfaces.MiddlewareComponent>(id).to(component);
        if (options) {
            this.addCliOptions(options);
        }
    }

    next(): IteratorResult<interfaces.MiddlewareComponent> {
        const done = {
            done: true,
            value: undefined
        } as any as IteratorResult<interfaces.MiddlewareComponent>;

        return this._idx < this._order.length ?
            {
                done: false,
                value: this.get<interfaces.MiddlewareComponent>(this._order[this._idx++])
            } : done;
    }

    [Symbol.iterator](): IterableIterator<interfaces.MiddlewareComponent> {
        this._idx = 0;
        return this;
    }

}

export class MappedMiddlewareContainer extends MiddlewareContainer {
    constructor(middleware: interfaces.MiddlewareComponentSequenceIterator, options?: inversifyInterfaces.ContainerOptions) {
        let order: Array<interfaces.MiddlewareComponentID> = [];
        let components: interfaces.MiddlewareSequenceArray = [];
        for (let id of middleware) {
            let component = middleware.get(id);
            if (component) {
                order.push(id);
                components.push(component);
            }
        }
        super(order, options);
        this.registerMiddleware(components);
    }
}
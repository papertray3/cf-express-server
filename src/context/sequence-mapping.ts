import { interfaces } from '../interfaces';
import { CliOptions } from '@papertray3/cf-express-config';

// map between symbols and Classes
// this will mainly be used to build a default list of middleware components
export class SequenceMapping implements interfaces.MiddlewareComponentSequenceIterator {

    // maintain the order of the sequence
    private _idx = 0;
    private _order = new Array<interfaces.MiddlewareComponentID>();
    private _map = new Map<interfaces.MiddlewareComponentID, interfaces.MiddlewareComponentDescriptor>();

    constructor(middleware?: interfaces.MiddlewareSequenceArray) {
        if (middleware) {
            middleware.forEach(component => {
                this.push(component);
            });
        }
    }

    [Symbol.iterator]() {
        this._idx = 0;
        return this;
    }

    push(id: interfaces.MiddlewareComponentID, component: interfaces.NewableMiddlewareComponent, options? : CliOptions): void;
    push(component: interfaces.MiddlewareSequenceElement): void;

    push(paramOne: interfaces.MiddlewareComponentID | interfaces.MiddlewareSequenceElement, component?: interfaces.NewableMiddlewareComponent, options? : CliOptions): void {
        let id: interfaces.MiddlewareComponentID;
        let addition: interfaces.MiddlewareComponentDescriptor;

        if (component) {
            id = paramOne as interfaces.MiddlewareComponentID;
            addition = {
                id: id,
                component: component,
                options: options
            };
        } else {
            let element = paramOne as interfaces.MiddlewareSequenceElement;
            if (interfaces.isMiddlewareComponentDescriptor(element)) {
                id = element.id;
                addition = {
                    id: id,
                    component: element.component,
                    options: element.options
                }
            } else {
                id = element.name;
                addition = {
                    id: id,
                    component: element
                }
            }
        }
        this._map.set(id, addition);
        this._order.push(id);

    }

    get(id: interfaces.MiddlewareComponentID) {
        return this._map.get(id);
    }

    has(id: interfaces.MiddlewareComponentID) {
        return this._map.has(id);
    }

    replaceOrPush(componentDescriptor: interfaces.MiddlewareComponentDescriptor): void;
    replaceOrPush(id: interfaces.MiddlewareComponentID, component: interfaces.NewableMiddlewareComponent, options? : CliOptions): void;
    replaceOrPush(paramOne: interfaces.MiddlewareComponentID | interfaces.MiddlewareComponentDescriptor, component?: interfaces.NewableMiddlewareComponent, options? : CliOptions): void {
        let id: interfaces.MiddlewareComponentID;
        let replacement: interfaces.MiddlewareComponentDescriptor;

        if (component) {
            id = paramOne as interfaces.MiddlewareComponentID;
            replacement = {
                id: id,
                component: component,
                options: options
            }
        } else {
            let element = paramOne as interfaces.MiddlewareComponentDescriptor;
            id = element.id;
            replacement = {
                id: id,
                component: element.component,
                options: element.options
            }
        }

        if (this.has(id)) {
            this._map.set(id, replacement);
        } else {
            this.push(replacement);
        }
    }

    next(): IteratorResult<interfaces.MiddlewareComponentID> {
        return this._idx < this._order.length ?
            { value: this._order[this._idx++], done: false } :
            { done: true, value: undefined } as any as IteratorResult<interfaces.MiddlewareComponentID>
    }

}
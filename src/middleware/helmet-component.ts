import { injectable, inject, optional } from 'inversify';
import { interfaces } from '../interfaces';

import helmet from 'helmet';

export class HelmetMiddlewareComponentBindingNames {
    static readonly ID : string = "HelmetComponent";
    static readonly CONFIG : string = "HelmetConfig";
}

@injectable()
export class HelmetMiddlewareComponent implements interfaces.MiddlewareComponent {
    constructor(@inject(HelmetMiddlewareComponentBindingNames.CONFIG) @optional() private _config : helmet.IHelmetConfiguration){ }

    install(app : interfaces.Application) : void {
        app.handler.use(helmet(this._config));
    }
}

export const helmetMiddlewareComponentDescriptor : interfaces.MiddlewareComponentDescriptor = {
    id: HelmetMiddlewareComponentBindingNames.ID,
    component: HelmetMiddlewareComponent
}
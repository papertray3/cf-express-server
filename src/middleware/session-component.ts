import { injectable, inject, optional } from 'inversify';
import { interfaces } from '../interfaces';
import session from 'express-session';

export class SessionMiddlewareComponentBindingNames {
    static readonly ID : string = 'SessionComponent';
    static readonly CONFIG : string = 'SessionConfig';
}

@injectable()
export class SessionMiddlewareComponent implements interfaces.MiddlewareComponent {
    constructor(@inject(SessionMiddlewareComponentBindingNames.CONFIG) @optional() protected _sessionConfig : session.SessionOptions) { 
        if (!this._sessionConfig) {
            this._sessionConfig = {
                saveUninitialized: true,
                secret: 'secret stuff',
                resave: false
            }
        }
    }

    install(app : interfaces.Application) : void {
        app.handler.use(session(this._sessionConfig));
    }
}

export const sessionMiddlewareComponentDescriptor : interfaces.MiddlewareComponentDescriptor = {
    id: SessionMiddlewareComponentBindingNames.ID,
    component: SessionMiddlewareComponent
}
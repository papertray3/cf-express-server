import { injectable, inject, optional } from 'inversify';
import { interfaces } from '../interfaces';
import { Strategy, AuthenticateOptions, use, authenticate, initialize, session, serializeUser, deserializeUser } from 'passport';
import { RequestHandler, Request, Response, NextFunction } from 'express';


export class AuthenticationMiddlewareComponentBindingNames {
    static readonly ID : string = 'AuthenticationComponent';
    static readonly STRATEGY_DESCRIPTOR = 'AuthenticationStrategyDescriptor';
}

export interface AuthenticationCustomCallback {
    (req : Request, res : Response, next : NextFunction) : (err: Error, user : unknown, info : unknown, status : unknown) => void;
}


export type AuthenticationMethod = 'get' | 'post';

export interface AuthenticationRouteDescriptor {
    route : string | RegExp;
    method? : AuthenticationMethod, //defaults to get
    options? : AuthenticateOptions,
    cb? : AuthenticationCustomCallback
}

type DeSerializer = (element : unknown, done : (err : any, element? : unknown) => void) => void;

export interface AuthenticationUserSerialization {
    serializeUser : DeSerializer,
    deserializeUser : DeSerializer
}

export class AuthenticationStrategyDescriptor implements IterableIterator<AuthenticationRouteDescriptor> {

    private _idx : number = 0;
    private _routes : Array<AuthenticationRouteDescriptor>;

    public readonly serializeUser : (user: unknown, done : (err : any, id?: unknown) => void) => void;
    public readonly deserializeUser : (id: unknown, done: (err : any, user?: unknown) => void) => void;

    constructor(name : string, strategy : Strategy, routes? : Array<AuthenticationRouteDescriptor>);
    constructor(name : string, strategy : Strategy, serializer : AuthenticationUserSerialization, routes? : Array<AuthenticationRouteDescriptor>);

    constructor(public readonly name : string, public readonly strategy : Strategy, paramThree? : AuthenticationUserSerialization | Array<AuthenticationRouteDescriptor>, routes? : Array<AuthenticationRouteDescriptor>) {
        if (routes) this._routes = routes;
        else if (paramThree && Array.isArray(paramThree)) this._routes = paramThree;
        else this._routes = [];

        if (paramThree && !Array.isArray(paramThree)) {
            this.serializeUser = paramThree.serializeUser;
            this.deserializeUser = paramThree.deserializeUser;
        } else {
            this.serializeUser = (user: unknown, done: (err: any, id?: unknown) => void) => {
                done(null, user);
            }

            this.deserializeUser = (id : unknown, done: (err: any, user?: unknown) => void) => {
                done(null, id);
            }
        }
        
    }

    addRoute(route : string, options?: AuthenticateOptions, method? : AuthenticationMethod) : void;
    addRoute(routeDescriptor : AuthenticationRouteDescriptor) : void;
    addRoute(paramOne : string | AuthenticationRouteDescriptor, options? : AuthenticateOptions, method : AuthenticationMethod = 'get') : void {
        let descriptor : AuthenticationRouteDescriptor;
        if (typeof paramOne === 'string') {
            descriptor = {
                route: paramOne,
                method: method,
                options: options
            }
        } else {
            descriptor = paramOne
        }

        this._routes.push(descriptor);
    }


    [Symbol.iterator]() {
        this._idx = 0;
        return this;
    }

    next() : IteratorResult<AuthenticationRouteDescriptor> {
        return this._idx < this._routes.length ? 
            {
                done: false,
                value: this._routes[this._idx++]
            } :
            {
                done: true,
                value: undefined
            } as any as IteratorResult<AuthenticationRouteDescriptor>;
    }
}

@injectable()
export class AuthenticationMiddlewareComponent implements interfaces.MiddlewareComponent {
    constructor(@inject(AuthenticationMiddlewareComponentBindingNames.STRATEGY_DESCRIPTOR) protected _strategyDescriptor : AuthenticationStrategyDescriptor) {

    }
    install(app : interfaces.Application) : void {

        let nextHandler = (req : Request, res : Response, next : NextFunction) => {
            next();
        }
        app.handler.use(initialize());
        app.handler.use(session());

        use(this._strategyDescriptor.strategy);

        serializeUser(this._strategyDescriptor.serializeUser);
         
        deserializeUser(this._strategyDescriptor.deserializeUser);

        for(let route of this._strategyDescriptor) {
            let func = route.method && route.method === 'post' ? app.handler.post.bind(app.handler) : app.handler.get.bind(app.handler);

            if (route.cb) {
                let callback = route.cb;
                if (route.options) {
                    func(route.route, (req : Request, res : Response, next : NextFunction) => {
                        authenticate(this._strategyDescriptor.name, route.options as AuthenticateOptions, callback(req, res, next))(req, res, next);
                    });
                } else {
                    func(route.route, (req: Request, res : Response, next : NextFunction) => {
                        authenticate(this._strategyDescriptor.name, callback(req, res, next))(req, res, next);
                    });
                }
            } else {
                if (route.options)
                    func(route.route, authenticate(this._strategyDescriptor.name, route.options), nextHandler);
                else
                    func(route.route, authenticate(this._strategyDescriptor.name), nextHandler);
            }
        }
    }
}

export const authenticationMiddlewareComponentDescriptor : interfaces.MiddlewareComponentDescriptor = {
    id: AuthenticationMiddlewareComponentBindingNames.ID,
    component: AuthenticationMiddlewareComponent
}
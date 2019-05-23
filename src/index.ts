import 'reflect-metadata';
import { SequenceMapping, MappedMiddlewareContainer } from './context';
import { staticMiddlewareComponentDescriptor, helmetMiddlewareComponentDescriptor, sessionMiddlewareComponentDescriptor, cloudantSessionMiddlewareComponentDescriptor } from './middleware';
import { Application } from './application';
import { commonOptions, CommonConfigNames } from '@papertray3/cf-express-config';
import { interfaces } from './interfaces';
import { Container } from 'inversify';

export * from './application';
export * from './context';
export * from './interfaces';
export * from './middleware';

const components : interfaces.MiddlewareSequenceArray = [
    helmetMiddlewareComponentDescriptor,
    sessionMiddlewareComponentDescriptor,
    staticMiddlewareComponentDescriptor
]


export namespace standard {
    export const mode = (defaultMode : string = 'development') => {
        return process.env.NODE_ENV ? process.env.NODE_ENV : defaultMode;
    }
    export const standardComponents = components;
    export const standardSequence = () => new SequenceMapping(standardComponents);
    export const standardContainer = () => {
        let container = new MappedMiddlewareContainer(standardSequence());
        container.addCliOptions(commonOptions);
        return container;
    }
}
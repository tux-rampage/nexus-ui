/**
 * This module provides defines the application repository
 */

import * as ng from 'angular';
import 'angular-resource';

/** Defines the result set */
export interface ResultSet<Entity>
{
    count: number;
    items: Entity[];
}

/** Defines an entity repository */
export interface IRepository<Entity>
{
    findOne(id: string|number): ng.IPromise<Entity>;
    find(query?: {[key: string]: string}): ng.IPromise<ResultSet<Entity>>;
    save(entity: Entity): ng.IPromise<Entity>;
    remove(entity: Entity): ng.IPromise<Entity>;
}

/**
 * Implements the REST repository 
 */
export class RestRepository<Entity>
{
    protected http: ng.IHttpService;

    /** Constructor*/
    construct(http: ng.IHttpService)
    {
        this.http = http;
    }
}

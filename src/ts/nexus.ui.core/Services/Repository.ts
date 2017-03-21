/**
 * This module provides defines the application repository
 */

import * as ng from 'angular';
import * as entities from '../Entities';

export const API_SERVICE_NAME : string = 'nexus.deployment.api';

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
}

export interface IUpdatableRepository<Entity> {
    save(entity: Entity): ng.IPromise<Entity>;
}

export interface IRemovableRepository<Entity> {
    remove(entity: Entity): ng.IPromise<Entity>;
}

export interface IFullEntityRepository<Entity>
{
}

/** Defines the application repo */
export interface IApplicationRepository extends IRepository<entities.Application>, IUpdatableRepository<entities.Application>
{}

/** Package repository definition */
export interface IPackageRepository extends IRepository<entities.Package>
{
    upload(file: object) : ng.IPromise<entities.Package>;
}

/** Repo definition for deploy targets */
export interface IDeployTargetRepository extends IFullEntityRepository<entities.DeployTarget>
{
    deploy(target: entities.DeployTarget, pkg: entities.ApplicationInstance) : ng.IPromise<entities.ApplicationInstance>;
}

/** Defines the deployment API */
export interface IDeploymentApi
{
    applications: IApplicationRepository;
    packages: IPackageRepository;
    deployTargets: IDeployTargetRepository;
}


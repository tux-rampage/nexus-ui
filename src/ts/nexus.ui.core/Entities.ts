
interface IdentifyableEntity
{
    id: string|number;
}

/**
 * Defines a package parameter 
 */
export interface PackageParameter
{
    name: string;
    label: string;
    'default'?: string;
    'type': string;
    required: boolean;
    options?: any;
    valueOptions?: {[value: string] : string};
}

/**
 * Defines the package entity
 */
export interface Package extends IdentifyableEntity
{
    name: string;
    type: string;
    version: string;
    variables?: {[name: string] : any};
    parameters?: {[name: string] : PackageParameter}; 
}

/**
 * Defines the application entity
 */
export interface Application extends IdentifyableEntity
{
    label: string;
    packages: string[]|number[];
}

interface ApplicationPackageReference extends IdentifyableEntity
{
    label: string;
    'package'?: Package;
    previousPackage?: Package;
}

/**
 * An application instance 
 */
export interface ApplicationInstance extends IdentifyableEntity
{
    label: string;
    application: ApplicationPackageReference;
    flavor: string;
    path: string;
    state: string;
    userParameters: {[param: string] : string};
    vhost: string;
}

/**
 * Defines the vhost entity
 */
export interface VHost extends IdentifyableEntity
{
    name: string;
    isDefault: boolean;
    flavor: string;
    aliases: string;
    enableSsl: boolean;
}

/**
 * Defines the node entity
 */
export interface Node extends IdentifyableEntity
{
    name: string;
    url: string;
    serverInfo?: {[key: string] : any};
    state: string;
    isAttached: boolean;
}

/** Defines the deployment target entity */
export interface DeployTarget extends IdentifyableEntity
{
    name: string;
    canManageVHosts: boolean;
    vhosts: VHost[];
    nodes: Node[];
    applications: ApplicationInstance[];
}
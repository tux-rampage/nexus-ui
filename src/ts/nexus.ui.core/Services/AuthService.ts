import * as ng from 'angular';

export {OAuthService} from './OAuthService';
export const SERVICE_NAME: string = 'nexus.ui.AuthService';

/**
 * Defines the authentication service interface
 */
export interface IAuthService
{
    /** 
     * This property keeps track of the authentication status
     */
    isAuthenticated : boolean;

    /** 
     * Start the authentication process
     * 
     * @returns A promise that is resolved when the authentication was 
     *          completed successfully. The promise is rejected when 
     *          the authentication is cancelled.
     */
    initiateAuthentication() : ng.IPromise<any>;
    
    /** 
     * Attempt to refresh the auth token
     * 
     * @returns A promise that is resolved with the access token when it was successfully refreshed and rejected when the refresh failed.
     */
    refresh() : ng.IPromise<string>;
}


import * as ng from 'angular';
import 'angular-oauth2';
import 'angular-material';

import {LoginController} from '../Controllers/LoginController';

export interface IAuthService
{
    isAuthenticated : boolean;
    initiateAuthentication() : ng.IPromise<any>;
    refresh() : ng.IPromise<string>;
}

export class AuthenticationService implements IAuthService 
{
    public static readonly SERVICE_NAME = 'nexus.AuthenticationService';
    
    static $inject = ['OAuth'];
    private state = null;
    
    private oauth: ng.oauth2.OAuth;
    private $timeout: ng.ITimeoutService;
    private dialog: ng.material.IDialogService;
    
    /**
     * Constructor
     * 
     * @param oauth The oauth instance
     */
    construct(oauth: ng.oauth2.OAuth, $timeout: ng.ITimeoutService, dialog: ng.material.IDialogService) 
    {
        this.oauth = oauth;
        this.$timeout = $timeout;
    }

    get isAuthenticated(): boolean 
    {
        if (!this.oauth.isAuthenticated()) {
            return false;
        }
        
        // TODO: Watch expiricy
        return true;
    }
    
    initiateAuthentication(): ng.IPromise<any> 
    {
        let oauth = this.oauth;
        
        this.dialog.show({
            templateUrl: 'assets/templates/nexus.ui.core/LoginDialog.html',
            clickOutsideToClose: false,
            escapeToClose: false,
            fullscreen: true,
            controller: LoginController,
            controllerAs: 'login',
            bindToController: true,
            locals: {
                login: function(username: string, password: string) : ng.IPromise<any> {
                    return oauth.getAccessToken({
                        username: username,
                        password: password
                    });
                }
            }
        });
        // TODO: Implement modal
        throw new Error('Method not implemented.');
    }   
    
    refresh() : ng.IPromise<string>
    {
        return this.oauth.getRefreshToken();
    }
}
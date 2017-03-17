
import * as ng from 'angular';
import * as jwtDecode from 'jwt-decode';
import 'angular-oauth2';
import 'angular-material';

import {IAuthService} from './AuthService';
import {LoginController} from '../Controllers/LoginController';

/** Define the oauth token provider */
interface IOAuthTokenProvider
{
    getAccessToken(): string;
}

/**
 * OAuth service implementation
 */
export class OAuthService implements IAuthService 
{
    /** Angular injections */
    static $inject: string[] = ['OAuth', '$timeout', '$mdDialog', '$q', 'OAuthToken' ];
    
    private oauth: ng.oauth2.OAuth;
    private tokenProvider: IOAuthTokenProvider;
    private $timeout: ng.ITimeoutService;
    private dialog: ng.material.IDialogService;
    private q: ng.IQService;
    
    /**
     * Constructor
     */
    construct(oauth: ng.oauth2.OAuth, $timeout: ng.ITimeoutService, dialog: ng.material.IDialogService, q: ng.IQService, tokenProvider: IOAuthTokenProvider) 
    {
        this.oauth = oauth;
        this.$timeout = $timeout;
        this.dialog = dialog;
        this.q = q;
        this.tokenProvider = tokenProvider;
    }

    /** Keep track of the authentication status */
    get isAuthenticated(): boolean 
    {
        if (!this.oauth.isAuthenticated()) {
            return false;
        }
        
        try {
            // Check if the token is expired
            let token: string = this.tokenProvider.getAccessToken();
            let decoded = jwtDecode(token);
            
            return decoded.exp < ((new Date()).getTime() / 1000);
        } catch (e) {
            return false;
        }
    }
    
    /** start the authentication process */
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
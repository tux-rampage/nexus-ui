import * as ng from 'angular';
import 'angular-oauth2';

export class AuthenticationService 
{
    public static readonly SERVICE_NAME = 'nexus.AuthenticationService';
    
    static $inject = ['OAuth'];
    private static authentication = null;
    
    private oauth: ng.oauth2.OAuth;
    
    construct(oauth: ng.oauth2.OAuth) {
        this.oauth = oauth;
    }
}
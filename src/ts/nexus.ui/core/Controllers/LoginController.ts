import * as ng from 'angular';

export class LoginController
{
    protected dialog: ng.material.IDialogService;
    private loginImpl?: (username: string, password:string) => ng.IPromise<any> = null;
    
    public username: string = '';
    public password: string = '';
    
    /**
     * Constructor
     */  
    public construct(dialog: ng.material.IDialogService)
    {
        this.dialog = dialog;
    }
    
    /**
     * Set the login implementation 
     */
    public set login(impl: (username: string, password:string) => ng.IPromise<any>)
    {
        this.loginImpl = impl; 
    }
    
    /**
     * Perform the login
     */
    public doLogin()
    {
        if (!this.username || !this.password) {
            return;
        }
        
        this.loginImpl(this.username, this.password).then(function() {
            this.dialog.hide();
        });
    }
}
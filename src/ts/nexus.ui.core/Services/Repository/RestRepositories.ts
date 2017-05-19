
import * as ng from 'angular';
import * as Interfaces from './Repositories';
import * as Entities from '../../Entities';

abstract class AbstractRestRepository
{
    static $inject: string[] = [ '$http', 'restBaseUrl' ];

    protected http: ng.IHttpService;
    protected baseUrl: string;

    constructor(baseUrl: string, $http: ng.IHttpService)
    {
        this.baseUrl = baseUrl;
        this.http = $http;
    }
}

export class ApplicationRepository extends AbstractRestRepository implements Interfaces.IApplicationRepository
{
    public findOne(id: string): ng.IPromise<Entities.Application>
    {
        let promise = this.http({
            method: 'GET',
            url: this.baseUrl + '/applications/' + id
        });

        return promise.then(function(result: ng.IHttpPromiseCallbackArg<Entities.Application>) {
            return result.data;
        });
    }

}
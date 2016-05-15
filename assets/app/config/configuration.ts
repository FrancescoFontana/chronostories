import {Injectable} from "angular2/core";

@Injectable()
export class Configuration {
    public zoom = {
        offset: 0,
        step: 150,
        strength: 0.6
    };

    public token = {
        name: 'token',
        expiration: (30 * 24 * 60 * 60 * 1000)
    };

    // public apiBasePath = 'https://aa2016-chronostories.herokuapp.com';
    public apiBasePath = ''
}
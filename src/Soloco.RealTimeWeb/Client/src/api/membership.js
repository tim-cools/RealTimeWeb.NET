import api from './';
import navigate from './navigate';
import { actions as userStateActions } from '../state/user';


//const proxy = $.connection.membership;

//proxy.client.LoginSuccessful = function (name) {
//    userStateActions.logon(name);
//};

//function login(userName, password) {
//    proxy.server.login(userName, password);
//}

function logonInit() {
    userStateActions.logon();
}

function logon(userName, password) {

    function handleResponse(response) {
        api.authenticated(response.access_token, response.refresh_token);
        loggedOn(userName);
    }

    function handleError(errors) {
        userStateActions.logonFailed(errors);
    }

    userStateActions.logonPending();
    
    const data = 'grant_type=password' 
        + '&username=' + userName 
        + '&password=' + password 
        + '&client_id=' + api.clientId 
        + '&scope=offline_access';
    
    api.post('token', data, handleResponse, handleError);
}

function logOff() {
    
    api.post('/account/signout');
    api.clearAuthentication();

    userStateActions.logoff();
    
    navigate.to('/');
}

function loggedOn(userName) {
    userStateActions.loggedOn(userName, false);
    navigate.to('/home');
}

function registerInit() {
    userStateActions.register();
}

function register(userName, eMail, password, confirmPassword) {

    function handleResponse(response) {
        logon(userName, password);
    }

    function handleError(errors) {
        userStateActions.registerFailed(errors);
    }

    var data = {
        userName: userName,
        eMail: eMail,
        password: password,
        confirmPassword: confirmPassword
    };

    userStateActions.registerPending();
    
    api.post('api/account/register', data, handleResponse, handleError);
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function externalProviderUrl(provider) {

    var redirectUri = api.serviceBase + 'account/authorized';
    var nonce = guid();

    return api.serviceBase + 'account/authorize/connect?provider=' + provider 
        + '&redirect_uri=' + redirectUri
        + '&scope=openid offline_access'
        + '&response_type=code'
        + '&client_id=' + api.clientId
        + '&nonce=' + nonce;
}

function externalProviderCompleted(fragment) {
    
    function handleResponse(response) {
        api.authenticated(response.access_token, response.refresh_token);
        initialize();
    }

    function handleError(errors) {
        userStateActions.logonFailed(errors);
    }
    
    const redirectUri = api.serviceBase + 'account/authorized';
    const data = 'grant_type=authorization_code&code=' + fragment.code 
        + '&client_id=' + api.clientId 
        + '&scope=offline_access' 
        + '&redirect_uri=' + redirectUri;

    api.post('token', data, handleResponse, handleError);
}

function initialize() {
      
    function handleResponse(response) {
        loggedOn(response.Name);
    }

    function handleError(errors) {
        logOff();
    }
    
    api.get('api/account', {}, handleResponse, handleError);    
}

//$.connection.hub.start()
//    .done(function(){ console.log('Now connected, connection ID=' + $.connection.hub.id); })
//    .fail(function(){ console.log('Could not Connect!'); });

export default {
    initialize: initialize,
    logon: logon,
    logonInit: logonInit,
    logOff: logOff,
    register: register,
    registerInit: registerInit,
    externalProviderUrl: externalProviderUrl,
    externalProviderCompleted: externalProviderCompleted
}
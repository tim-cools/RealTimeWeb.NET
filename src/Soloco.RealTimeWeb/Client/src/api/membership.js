import api from './';
import navigate from './navigate';
import { actions as userStateActions } from '../state/user';
import store from 'store';

//const proxy = $.connection.membership;
const storageKey = 'authorizationData';
const id = guid();

//proxy.client.LoginSuccessful = function (name) {
//    userStateActions.logon(name);
//};

//function login(userName, password) {
//    proxy.server.login(userName, password);
//}

function logonInit() {
    userStateActions.logon();
}

function logon(userName, password, useRefreshTokens) {

    function handleResponse(response) {
        loggedOn(userName, response.access_token, useRefreshTokens);
    }

    function handleError(errors) {
        userStateActions.logonFailed(errors);
    }

    var data = 'grant_type=password&username=' + userName + '&password=' + password;
    if (useRefreshTokens) {
        data = data + '&client_id=' + api.clientId;
    }

    userStateActions.logonPending();

    api.post('token', data, handleResponse, handleError);
}

function logOff() {

    store.remove(storageKey);

    userStateActions.logoff();
    
    navigate.to('/');
}

function loggedOn(userName, token, refreshToken) {
         
    const data = {
        token: token, 
        userName: userName,
        useRefreshTokens: refreshToken ? true : false,
        refreshToken: refreshToken
    };

    store.set(storageKey, data);
        
    userStateActions.loggedOn(userName, refreshToken ? true : false);
    
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
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    })
}

function externalProviderUrl(provider) {
    var redirectUri = api.serviceBase + 'account/authenticate/finished';

    var nonce = guid();

    return api.serviceBase + "account/authorize?provider=" + provider 
        + "&redirect_uri=" + redirectUri
        + "&scope=openid profile"
        + "&nonce=" + nonce +
        + "&state=" + id +
        + "&response_type=form_post"
        + "&response_type=token"
        + "&client_id=" + api.clientId;
}

function externalProviderCompleted(cookie) {

    function handleResponse(response) {
        loggedOn(response.userName, response.access_token, null);
    }

    function handleError(request) {
        const data = JSON.parse(request.response);
        userStateActions.associateExternalFailed(data.error_description);
    }

    //if (fragment.haslocalaccount === 'False') {
    //    return userStateActions.associateExternal(fragment.provider, fragment.external_access_token, fragment.external_user_name);        
    //}

    //const data = 'provider=' + fragment.provider + '&externalAccessToken=' + fragment.external_access_token;

    api.get('api/account/authorize', data, handleResponse, handleError, cookie);
}

function registerExternal(userName, provider, externalAccessToken) {
    
    function handleResponse(response) {
        loggedOn(response.userName, response.access_token, null);
    }

    function handleError(errors, request) {
        userStateActions.associateExternalFailed(errors[0]);
    }

    const data = {
        userName: userName,
        provider: provider,
        externalAccessToken: externalAccessToken
    };

    userStateActions.associateExternalPending();

    api.post('api/account/registerexternal', data, handleResponse, handleError);
}

function initialize() {
    const data = store.get(storageKey);
    if (data) {
        loggedOn(data.userName, data.token, data.refreshToken);
    }
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
    externalProviderCompleted: externalProviderCompleted,
    registerExternal: registerExternal
}
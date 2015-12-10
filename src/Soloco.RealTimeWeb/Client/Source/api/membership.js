import api from './';
import navigate from './navigate';
import { actions as userStateActions } from '../state/user';
import store from 'store';

//const proxy = $.connection.membership;
const storageKey = 'authorizationData';

//proxy.client.LoginSuccessful = function (name) {
//    userStateActions.logon(name);
//};

//function login(userName, password) {
//    proxy.server.login(userName, password);
//}

function login(userName, password, useRefreshTokens) {

    function handleResponse(response) {
        loggedOn(userName, response.access_token, useRefreshTokens);
    }

    function handleError(request) {
        const data = JSON.parse(request.response);
        userStateActions.logonFailed(data.error_description);
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
        
    userStateActions.logon(userName, refreshToken ? true : false);
    
    navigate.to('/home');
}

function externalProviderUrl(provider) {
    var redirectUri = location.protocol + '//' + location.host + '/Account/Complete';

    return api.serviceBase + "api/Account/ExternalLogin?provider=" + provider
        + "&response_type=token&client_id=" + api.clientId
        + "&redirect_uri=" + redirectUri;
}

function externalProviderCompleted(fragment) {

    function handleResponse(response) {
        loggedOn(response.userName, response.access_token, null);
    }

    function handleError(request) {
        const data = JSON.parse(request.response);
        userStateActions.associateExternalFailed(data.error_description);
    }

    if (fragment.haslocalaccount === 'False') {
        return userStateActions.associateExternal(fragment.provider, fragment.external_access_token, fragment.external_user_name);        
    }

    const data = 'provider=' + fragment.provider + '&externalAccessToken=' + fragment.external_access_token;

    api.get('api/account/ObtainLocalAccessToken', data, handleResponse, handleError);
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
    login: login,
    logOff: logOff,
    initialize: initialize,
    externalProviderUrl: externalProviderUrl,
    externalProviderCompleted: externalProviderCompleted,
    registerExternal: registerExternal
}
import api from './';
import navigate from './navigate';
import { actions as userActions } from '../state/user';
import dispatcher from '../state/dispatcher';
import reqwest from 'reqwest';
import store from 'store';

const proxy = $.connection.membership;
const storageKey = 'authorizationData';

proxy.client.LoginSuccessful = function (name) {
    var action = userActions.logon(name);
    dispatcher.dispatch(action);
};

//function login(userName, password) {
//    proxy.server.login(userName, password);
//}

function login(userName, password, useRefreshTokens) {

    function handleResponse(response) {
            
        const data = {
            token: response.access_token, 
            userName: userName,
            useRefreshTokens: useRefreshTokens ? true : false,
            refreshToken: useRefreshTokens ? response.refresh_token : null
        };
        store.set(storageKey, data);
        loggedOn(userName, useRefreshTokens);
    }

    function handleError(request) {
        const data = JSON.parse(request.response);
        const action = userActions.logonFailed(data.error_description);
        dispatcher.dispatch(action);
    }

    var data = 'grant_type=password&username=' + userName + '&password=' + password;

    if (useRefreshTokens) {
        data = data + '&client_id=' + api.clientId;
    }

    reqwest({
        url: api.serviceBase + 'token',
        method: 'post',
        data: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        success: handleResponse,
        error: handleError
    });
};

function logOff() {

    store.remove(storageKey);

    const action = userActions.logoff();
    dispatcher.dispatch(action);

    navigate.to('/');
};

function loggedOn(userName, useRefreshTokens) {
            
    const action = userActions.logon(userName, useRefreshTokens);
    dispatcher.dispatch(action);

    navigate.to('/home');
}

function initialize() {
    const data = store.get(storageKey);
    if (data) {
        loggedOn(data.userName, data.useRefreshTokens);
    }
}

$.connection.hub.start()
    .done(function(){ console.log('Now connected, connection ID=' + $.connection.hub.id); })
    .fail(function(){ console.log('Could not Connect!'); });

export default {
    login: login,
    logOff: logOff,
    initialize: initialize
}
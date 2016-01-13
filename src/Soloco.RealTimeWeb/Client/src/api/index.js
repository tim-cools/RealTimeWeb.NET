import reqwest from 'reqwest';
import store from 'store';
import { actions as userStateActions } from '../state/user';

const serviceBase = window.location.protocol + '//' + window.location.host + '/';
const clientId = 'realTimeWebClient';
const storageKey = 'authorizationData';

function call(verb, contentType, url, data, responseHandler, errorHandler) {

    function makeCall(success, error) {

        const authentication = store.get(storageKey);
        const headers = { 'Accept': 'application/json' };
        if (authentication) {
            headers.Authorization = 'Bearer ' + authentication.token;
        }

        reqwest({
            url: serviceBase + url,
            method: verb,
            //type: 'json',
            contentType: contentType,
            data: data,
            headers: headers,
            success: success,
            error: error
        });
    }
    
    function refreshTokenOnUnauthorized(response) {
        
        function handleResponse(response) {
            authenticated(response.access_token, response.refresh_token);
            makeCall(responseHandler, parseErrors);
        }

        function finalLogOff(response) {
            userStateActions.logoff();
            parseErrors(response);
        }
        
        const authentication = store.get(storageKey);
            
        //todo remove 500 check, this is due to a bug, should be fixed in RC2
        if (response.status === 401 || response.status === 500) {
            clearAuthentication();
            if (authentication && authentication.refreshToken) {
                const data = 'grant_type=refresh_token&refresh_token=' + authentication.refreshToken + '&client_id=' + clientId;
                return post('token', data, handleResponse, finalLogOff);
            }
        } 
        finalLogOff(response);
    }

    function parseErrors(response) {
        function formatErrors() {
            try {
                const data = JSON.parse(response.response);
                if (data.error_description) {
                    return [data.error_description];
                }
                if (data.Errors) {
                    return data.Errors;
                }
            } catch (e) {
            }

            return [ "Something went wrong :(" ];
        }

        if (!errorHandler) return;

        const error = formatErrors();
        return errorHandler(error, response);
    }

    makeCall(responseHandler, refreshTokenOnUnauthorized);
}

function get(url, data, responseHandler, errorHandler) {
    call('get', 'application/json', url, data, responseHandler, errorHandler);
}

function post(url, data, responseHandler, errorHandler) {
    call('post', 'application/x-www-form-urlencoded', url, data, responseHandler, errorHandler);
}

function clearAuthentication() {
    store.remove(storageKey);
}

function authenticated(token, refreshToken) {
    const data = {
        token: token, 
        useRefreshTokens: refreshToken ? true : false,
        refreshToken: refreshToken
    };

    store.set(storageKey, data);
}

export default {
    serviceBase: serviceBase,
    clientId: clientId,
    post: post,
    get: get,
    clearAuthentication: clearAuthentication,
    authenticated: authenticated
}
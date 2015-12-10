import reqwest from 'reqwest';

const jsonHeaders = { 'Accept': 'application/json' };
const serviceBase = 'http://localhost:5010/';
const clientId = 'realTimeWebClient';

function call(verb, contentType, url, data, responseHandler, errorHandler) {
    
    function parseErrors(handler) {
        return function(request) {
            const data = JSON.parse(request.response);
            return handler(data.errors, request);
        }
    }

    reqwest({
        url: serviceBase + url,
        method: verb,
        //type: 'json',
        contentType: contentType,
        data: data,
        headers: jsonHeaders,
        success: responseHandler,
        error: parseErrors(errorHandler)
    });
}

function get(url, data, responseHandler, errorHandler) {
    call('get', 'application/json', url, data, responseHandler, errorHandler);
}

function post(url, data, responseHandler, errorHandler) {
    call('post', 'application/x-www-form-urlencoded', url, data, responseHandler, errorHandler);
}

export default {
    serviceBase: serviceBase,
    clientId: clientId,
    post: post,
    get: get
}
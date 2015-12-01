import reqwest from 'reqwest';

const jsonHeaders = { 'Accept': 'application/json' };
const serviceBase = 'http://localhost:12777/';
const clientId = 'realTimeWebClient';

function call(verb, contentType, url, data, responseHandler, errorHandler) {
    reqwest({
        url: serviceBase + url,
        method: verb,
        //type: 'json',
        contentType: contentType,
        data: data,
        headers: jsonHeaders,
        success: responseHandler,
        error: errorHandler
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
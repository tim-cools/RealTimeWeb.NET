import reqwest from 'reqwest';

const serviceBase = 'http://localhost:12777/';
//var serviceBase = 'http://ngauthenticationapi.azurewebsites.net/';
const clientId = 'realTimeWebClient';

function get(url, data, responseHandler, errorHandler) {
    reqwest({
        url: serviceBase + url,
        method: 'get',
        data: data,
        success: responseHandler,
        error: errorHandler
    });
}

function post(url, data, responseHandler, errorHandler) {
    reqwest({
        url: serviceBase + url,
        method: 'post',
        data: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        success: responseHandler,
        error: errorHandler
    });
}

export default {
    serviceBase: serviceBase,
    clientId: clientId,
    post: post,
    get: get
}
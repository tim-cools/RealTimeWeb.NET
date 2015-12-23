import reqwest from 'reqwest';

const jsonHeaders = { 'Accept': 'application/json' };
const serviceBase = window.location.protocol + '//' + window.location.host + '/';
const clientId = 'realTimeWebClient';

function call(verb, contentType, url, data, responseHandler, errorHandler) {
    
    function parseErrors(handler) {
        function formatErrors(data) {
            if (data.error_description) {
                return [ data.error_description ];
            } 
            if (data.Errors) {
                return data.Errors;
            }
            return [ "Something went wrong :(" ];
        }

        return function(request) {
            const data = JSON.parse(request.response);
            var error = formatErrors(data);
            return handler(error, request);
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
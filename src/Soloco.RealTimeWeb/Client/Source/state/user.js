import dispatcher from './dispatcher';
var dispatch = dispatcher.dispatch;

export const userStatus = {
    notAuthenticated: 'notAuthenticated',
    authenticated: 'authenticated',
    associateExternal: 'associateExternal',
    values: ['notAuthenticated', 'authenticated', 'associateExternal']
};

export const actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',
    
    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING',
    LOG_ON_FAILED: 'LOG_ON_FAILED',

    ASSOCIATE_EXTERNAL: 'ASSOCIATE_EXTERNAL',
    ASSOCIATE_EXTERNAL_PENDING: 'ASSOCIATE_EXTERNAL_PENDING',
    ASSOCIATE_EXTERNAL_FAILED: 'ASSOCIATE_EXTERNAL_FAILED'
};

export const actions = {
    logon: function(name, refreshTokens) {
        return dispatch({
            type: actionsDefinitions.LOG_ON,
            name: name,
            refreshTokens: refreshTokens
        });
    },

    logonPending: function() {
        return dispatch({
            type: actionsDefinitions.LOG_ON,
            processing: true
        });
    },

    logonFailed: function(message) {
        return dispatch({
            type: actionsDefinitions.LOG_ON_FAILED,
            message: message
        });
    },

    logoff: function() {
        return dispatch({
            type: actionsDefinitions.LOG_OFF
        });
    },

    associateExternal: function(provider, externalAccessToken, externalUserName) {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL,
            provider: provider,
            externalAccessToken: externalAccessToken,
            externalUserName: externalUserName
        });
    },
    
    associateExternalPending: function () {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL,
            processing: true
        });
    },

    associateExternalFailed: function (message) {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_FAILED, 
            message: message
        });
    }
};

const notAuthenticated = { status: userStatus.notAuthenticated };

export function reducer(state = notAuthenticated, action) {
    switch (action.type) {
        case actionsDefinitions.LOG_ON:
            return {
                status: userStatus.authenticated,
                name: action.name,
                processing: action.processing
            };

        case actionsDefinitions.LOG_ON_FAILED:
            return {
                status: userStatus.notAuthenticated, 
                message: action.message
            };

        case actionsDefinitions.LOG_OFF:
            return {
                status: userStatus.notAuthenticated
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL:
            return {
                status: userStatus.associateExternal,
                provider: action.provider,
                externalAccessToken: action.externalAccessToken,
                externalUserName: action.externalUserName,
                processing: action.processing
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL_FAILED:
            return {
                status: userStatus.associateExternal, 
                message: action.message
            };

        default:
            return state;
    }
}
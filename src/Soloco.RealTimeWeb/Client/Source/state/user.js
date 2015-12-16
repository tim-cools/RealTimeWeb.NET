import dispatcher from './dispatcher';
var dispatch = dispatcher.dispatch;

export const userStatus = {
    authenticated: 'authenticated',
    notAuthenticated: 'notAuthenticated',

    values: ['authenticated', 'notAuthenticated']
};

export const actionsDefinitions = {

    LOG_OFF: 'LOG_OFF',
    LOGGED_ON: 'LOGGED_ON',
    
    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING',
    LOG_ON_FAILED: 'LOG_ON_FAILED',

    REGISTER: 'REGISTER',
    REGISTER_PENDING: 'REGISTER_PENDING',
    REGISTER_FAILED: 'REGISTER_FAILED',
    
    ASSOCIATE_EXTERNAL: 'ASSOCIATE_EXTERNAL',
    ASSOCIATE_EXTERNAL_PENDING: 'ASSOCIATE_EXTERNAL_PENDING',
    ASSOCIATE_EXTERNAL_FAILED: 'ASSOCIATE_EXTERNAL_FAILED'
};

export const actions = {
    logon: function() {
        return dispatch({
            type: actionsDefinitions.LOG_ON
        });
    },
    
    loggedOn: function(name, refreshTokens) {
        return dispatch({
            type: actionsDefinitions.LOGGED_ON,
            name: name,
            refreshTokens: refreshTokens
        });
    },

    logonPending: function() {
        return dispatch({
            type: actionsDefinitions.LOG_ON_PENDING
        });
    },

    logonFailed: function(errors) {
        return dispatch({
            type: actionsDefinitions.LOG_ON_FAILED,
            errors: errors
        });
    },

    logoff: function() {
        return dispatch({
            type: actionsDefinitions.LOG_OFF
        });
    },

    register: function() {
        return dispatch({
            type: actionsDefinitions.REGISTER
        });
    },

    registerPending: function() {
        return dispatch({
            type: actionsDefinitions.REGISTER_PENDING
        });
    },

    registerFailed: function(errors) {
        return dispatch({
            type: actionsDefinitions.REGISTER_FAILED,
            errors: errors
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
            type: actionsDefinitions.ASSOCIATE_EXTERNAL_PENDING
        });
    },

    associateExternalFailed: function (errors) {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL_FAILED, 
            errors: errors
        });
    }
};

const notAuthenticated = { status: userStatus.notAuthenticated };

export function reducer(state = notAuthenticated, action) {
    switch (action.type) {
        case actionsDefinitions.LOGGED_ON:
            return {
                status: userStatus.authenticated,
                name: action.name
            };

        case actionsDefinitions.LOG_ON:
            return {
                status: userStatus.notAuthenticated,
                logon: { }
            };

        case actionsDefinitions.LOG_ON_PENDIG:
            return {
                status: userStatus.notAuthenticated,
                name: state.name,
                logon: {
                    pending: true
                }
            };

        case actionsDefinitions.LOG_ON_FAILED:
            return {
                status: userStatus.notAuthenticated,
                name: state.name,
                logon: {
                    errors: action.errors
                }
            };

        case actionsDefinitions.LOG_OFF:
            return {
                status: userStatus.notAuthenticated
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL:
            return {
                status: userStatus.notAuthenticated,
                associateExternal: {
                    provider: action.provider,
                    accessToken: action.externalAccessToken,
                    userName: action.externalUserName
                }
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL_PENDING:
            return {
                status: userStatus.notAuthenticated,
                associateExternal: {
                    pending: true,
                    provider: state.associateExternal.provider,
                    token: state.associateExternal.token,
                    userName: state.associateExternal.userName
                }
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL_FAILED:
            return {
                status: userStatus.notAuthenticated, 
                associateExternal: {
                    errors: action.errors,
                    provider: state.associateExternal.provider,
                    token: state.associateExternal.token,
                    userName: state.associateExternal.userName
                }
            };
            
        case actionsDefinitions.REGISTER:
            return {
                status: userStatus.notAuthenticated, 
                register: { }
            };
            
        case actionsDefinitions.REGISTER_PENDING:
            return {
                status: userStatus.notAuthenticated, 
                register: {
                    pending: true
                }
            };

        case actionsDefinitions.REGISTER_FAILED:
            return {
                status: userStatus.notAuthenticated,
                register: {
                    errors: action.errors
                }
            };

        default:
            return state;
    }
};
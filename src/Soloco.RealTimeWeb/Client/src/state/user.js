import { dispatch } from './dispatcher';

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
    REGISTER_FAILED: 'REGISTER_FAILED'
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

        case actionsDefinitions.LOG_ON_PENDING:
            return {
                status: userStatus.notAuthenticated,
                logon: {
                    pending: true
                }
            };

        case actionsDefinitions.LOG_ON_FAILED:
            return {
                status: userStatus.notAuthenticated,
                logon: {
                    errors: action.errors
                }
            };

        case actionsDefinitions.LOG_OFF:
            return {
                status: userStatus.notAuthenticated
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
export const userStatus = {
    notAuthenticated: 'notAuthenticated',
    authenticated: 'authenticated',
    logonPending: 'logonPending',
    values: ['notAuthenticated', 'authenticated', 'logonPending']
};

export const actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',
    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING',
    LOG_ON_FAILED: 'LOG_ON_FAILED'
};

export const actions = {
    logon: function (name, refreshTokens) {
        return {
            type: actionsDefinitions.LOG_ON, 
            name: name, 
            refreshTokens: refreshTokens
        };
    },

    logonPending: function () {
        return {
            type: actionsDefinitions.LOG_ON_PENDING
        };
    },

    logonFailed: function (message) {
        return {
            type: actionsDefinitions.LOG_ON_FAILED, 
            message: message
        };
    },

    logoff: function () {
        return {
            type: actionsDefinitions.LOG_OFF
        };
    }
};

const notAuthenticated = { status: userStatus.notAuthenticated };

export function reducer(state = notAuthenticated, action) {
    switch (action.type) {
        case actionsDefinitions.LOG_ON:
            return {
                status: userStatus.authenticated,
                name: action.name
            };

        case actionsDefinitions.LOG_ON_PENDING:
            return {
                 status: userStatus.logonPending
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

        default:
            return state;
    }
}


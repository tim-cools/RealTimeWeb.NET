export const userStatus = {
    notAuthenticated: 'notAuthenticated',
    authenticated: 'authenticated',
    logonPending: 'logonPending',
    associateExternal: 'associateExternal',
    values: ['notAuthenticated', 'authenticated', 'logonPending', 'associateExternal']
};

export const actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',
    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING',
    LOG_ON_FAILED: 'LOG_ON_FAILED',
    ASSOCIATE_EXTERNAL: 'ASSOCIATE_EXTERNAL'
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
    },

    associateExternal: function(provider, externalAccessToken, externalUserName) {
        return {
            type: actionsDefinitions.ASSOCIATE_EXTERNAL, 
            provider: provider, 
            externalAccessToken: externalAccessToken, 
            externalUserName: externalUserName
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

        case actionsDefinitions.ASSOCIATE_EXTERNAL:
            return {
                status: userStatus.associateExternal,
                provider: action.provider,
                externalAccessToken: action.externalAccessToken,
                externalUserName: action.externalUserName
            };

        default:
            return state;
    }
}


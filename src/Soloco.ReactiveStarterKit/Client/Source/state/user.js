let notAuthenticated = {
    status: userStatus.notAuthenticated
};

function authenticated(name) {
    return {
        status: userStatus.authenticated,
        name: name
    };
}

export const actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',
    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING'
};

export const userStatus = {
    notAuthenticated: 'notAuthenticated',
    authenticated: 'authenticated',
    logonPending: 'logonPending',
    values: ['notAuthenticated', 'authenticated', 'logonPending']
};

export const actions = {
    logon: function (name) {
        return {type: actionsDefinitions.LOG_ON, name};
    },

    logonPending: function () {
        return {type: actionsDefinitions.LOG_ON_PENDING};
    },

    logoff: function () {
        return {type: actionsDefinitions.LOG_OFF};
    }
};

export function reducer(state = notAuthenticated, action) {
    switch (action.type) {
        case actionsDefinitions.LOG_ON:
            return authenticated(action.name);

        case actionsDefinitions.LOG_ON_PENDING:
            return { status: userStatus.logonPending };

        case actionsDefinitions.LOG_OFF:
            return notAuthenticated;

        default:
            return state;
    }
}


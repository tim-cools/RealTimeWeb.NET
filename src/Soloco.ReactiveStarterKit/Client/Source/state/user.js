let notAuthenticated = {
    authenticated: false
};

function authenticated(name) {
    return {
        authenticated: true,
        name: name
    };
}

export const actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',
    LOG_ON: 'LOG_ON'
};

export const actions = {
    logon: function (name) {
        return {type: actionsDefinitions.LOG_ON, name};
    },

    logoff: function () {
        return {type: actionsDefinitions.LOG_OFF, name};
    }
};

export function reducer(state = notAuthenticated, action) {
    switch (action.type) {
        case actionsDefinitions.LOG_ON:
            return authenticated(action.name);
        case actionsDefinitions.LOG_OFF:
            return notAuthenticated;
        default:
            return state;
    }
}


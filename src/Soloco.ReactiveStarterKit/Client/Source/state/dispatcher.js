var dispatcher;

function set(value) {
    dispatcher = value;
}

function dispatch(action) {
    return dispatcher(action);
}

export default {
    set: set,
    dispatch: dispatch
}
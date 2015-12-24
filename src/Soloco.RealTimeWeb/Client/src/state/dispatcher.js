var dispatcher;

//todo remove singleton pattern if rendering server side (use something like domain-context)

function set(value) {
    if (!value) throw Error('Dispatcher should not be null');
    dispatcher = value;
}

export function dispatch(action) {
    if (!dispatcher) throw Error('Dispatcher is not set');
    return dispatcher(action);
}

export default {
    set: set 
}
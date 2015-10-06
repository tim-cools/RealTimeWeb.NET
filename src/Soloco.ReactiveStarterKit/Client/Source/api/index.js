
var dispatch;

function setDispatch(value) {
    dispatch = value;
}

function getDispatch(value) {
    return dispatch;
}

export default {
    setDispatch: setDispatch,
    getDispatch: getDispatch
}
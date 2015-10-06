import api from './';
import { actions as userActions } from '../state/user';

var proxy = $.connection.membership;

proxy.client.LoginSuccessful = function (name) {
    var action = userActions.logon(name)
    var dispatch = api.getDispatch();
    dispatch(action);
};

function login(userName, password) {
    proxy.server.login(userName, password);
}

$.connection.hub.start()
    .done(function(){ console.log('Now connected, connection ID=' + $.connection.hub.id); })
    .fail(function(){ console.log('Could not Connect!'); });

export default {
    login: login
}
import { pushState } from 'redux-router';
import dispatcher from '../state/dispatcher';

var to = function (url) {
    dispatcher.dispatch(pushState(null, url));
};

export default { to: to }
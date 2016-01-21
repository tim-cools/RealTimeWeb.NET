import { pushState  } from 'redux-router';
import { dispatch } from '../state/dispatcher';

var to = function (url) {
    dispatch(pushState(null, url));
};

export default { to: to }
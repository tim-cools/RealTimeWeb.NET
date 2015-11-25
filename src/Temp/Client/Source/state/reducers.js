import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';
import { reducer as userReducer } from './user';

const reducers = combineReducers({
    router: routerStateReducer,
    user: userReducer
});

export default reducers;
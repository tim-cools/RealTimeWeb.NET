import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';
import { reducer as userReducer } from './user';
import { reducer as documentationReducer } from './documentation';

const reducers = combineReducers({
    router: routerStateReducer,
    user: userReducer,
    documentation: documentationReducer
});

export default reducers;
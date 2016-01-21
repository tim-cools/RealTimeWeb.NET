import { combineReducers } from 'redux';
import { routerStateReducer } from 'redux-router';
import { reducer as userReducer } from './user';
import { reducer as documentationReducer } from './documentation';
import { reducer as vehiclesReducer } from './vehicles';

const reducers = combineReducers({
    router: routerStateReducer,
    user: userReducer,
    documentation: documentationReducer,
    vehicles: vehiclesReducer
});

export default reducers;
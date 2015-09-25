import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers from './state/reducers';
import Router from './router';
import api from './api/';

let store = createStore(reducers);
api.setDispatch(store.dispatch);

let contentElement = document.getElementById('application-content');

React.render((
    <Provider store={store}>
    {() => <Router />}
    </Provider>
), contentElement);

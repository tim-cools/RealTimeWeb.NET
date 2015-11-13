import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers from './state/reducers';
import dispatcher from './state/dispatcher';

import Router from './router';

let store = createStore(reducers);
dispatcher.set(store.dispatch);

let contentElement = document.getElementById('application-content');

React.render((
    <Provider store={store}>
    {() => <Router />}
    </Provider>
), contentElement);

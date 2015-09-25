import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers from './state/reducers';
import Router from './router';

let store = createStore(reducers);
let contentElement = document.getElementById('application-content');

React.render((
    <Provider store={store}>
    {() => <Router />}
    </Provider>
), contentElement);

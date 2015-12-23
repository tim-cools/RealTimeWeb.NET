import React, { PropTypes, Component } from 'react';
import { Router, Route, Link, IndexRoute } from 'react-router';
import { ReduxRouter } from 'redux-router';

import MainPage from './components/MainPage';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import LogonView from './components/LogonView';
import RegisterView from './components/RegisterView';
import DocumentationView from  './components/DocumentationView';

import NotFoundPage from './components/NotFoundPage';

class ApplicationRouter extends Component {
    render() {
        return (
            <ReduxRouter>
                <Route path="/" component={MainPage}>
                    <IndexRoute component={LogonView}/>.
                    <Route path="home" component={HomeView} />
                    <Route path="about" component={AboutView} />
                    <Route path="register" component={RegisterView} />
                    <Route path="logon" component={LogonView} />
                    <Route path="documentation" component="{DocumentationView}" />
                </Route>
                <Route path="*" component={NotFoundPage}/>
            </ReduxRouter>
        );
    }
}

export default ApplicationRouter;

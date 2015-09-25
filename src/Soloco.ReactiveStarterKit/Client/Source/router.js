import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router';

import MainPage from './components/MainPage';
import AboutView from './components/AboutView';
import LogonView from './components/LogonView';
import ToDoExampleView from './components/ToDoExampleView';

import NotFoundPage from './components/NotFoundPage';

class ApplicationRouter extends Component {
    render() {
        return (
            <Router>
                <Route path="/" component={MainPage}>
                    <Route path="about" component={AboutView} />
                    <Route path="todo" component={ToDoExampleView} />
                    <Route path="logon" component={LogonView} />
                </Route>
                <Route path="*" component={NotFoundPage}/>
            </Router>
        );
    }
}

export default ApplicationRouter;

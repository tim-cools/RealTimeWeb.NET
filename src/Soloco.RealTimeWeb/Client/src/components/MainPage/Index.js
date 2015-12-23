import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Button, Panel, Jumbotron } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';

import { actions as userActions, userStatus } from '../../state/user'
import Header from './header';
import Footer from './footer';

class Application extends Component {
    render() {
        return (
            <div>
                <Header
                    userAuthenticated={this.props.loggedOn}
                    userName={this.props.name} />
                {this.props.children}
                <Container>
                    <Footer />
                </Container>
            </div>
        );
    }
}

Application.propTypes = {
    loggedOn: PropTypes.bool,
    name: PropTypes.string
};

function select(state) {
    return {
        loggedOn: state.user.status === userStatus.authenticated,
        name: state.user.name
    };
}

export default connect(select)(Application);
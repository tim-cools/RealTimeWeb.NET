import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Button, Panel, Jumbotron } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';

import { actions as userActions } from '../../state/user'
import Header from './header';
import Footer from './footer';

class Application extends Component {
    render() {
        const { dispatch, user } = this.props;
        return (
            <div>
                <Header
                    user={user}
                    onLogonClick={() => dispatch(userActions.logon('haha'))}
                    onLogoffClick={() => dispatch(userActions.logoff())} />
                <Container>
                    {this.props.children}
                    <Footer />
                </Container>
            </div>
        );
    }
}

Application.propTypes = {
    user: PropTypes.shape({
        authenticated: PropTypes.bool.isRequired,
        name: PropTypes.string
    }).isRequired
};

function select(state) {
    return { user: state.user };
}

export default connect(select)(Application);
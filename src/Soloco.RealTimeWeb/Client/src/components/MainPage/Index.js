import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Button, Panel, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'
import Header from './Header';
import Footer from './Footer';

class MainPage extends Component {
    render() {
        return (
            <div>
                <Header
                    userAuthenticated={this.props.loggedOn}
                    userName={this.props.name} />
                {this.props.children}
                <div className='container'>
                    <Footer />
                </div>
            </div>
        );
    }
}

MainPage.propTypes = {
    loggedOn: PropTypes.bool,
    name: PropTypes.string
};

function mapStateToProps(state) {
    return {
        loggedOn: state.user.status === userStatus.authenticated,
        name: state.user.name
    };
}

export default connect(mapStateToProps)(MainPage);
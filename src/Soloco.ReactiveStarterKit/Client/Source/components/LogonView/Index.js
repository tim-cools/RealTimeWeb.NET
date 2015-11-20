import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'
import membership from '../../api/membership'

class LogonPage extends Component {
    onClick() {
        const { dispatch } = this.props;
        const { userNameInput, passwordInput } = this.refs;
        var userName = userNameInput.getValue();
        var password = passwordInput.getValue();

        membership.login(userName, password);

        dispatch(userActions.logonPending());
    }

    authExternalProvider(provider) {

        var externalProviderUrl = membership.externalProviderUrl(provider);
        window.open(externalProviderUrl, "Authenticate Account", "location=0,status=0,width=600,height=750");
    }

    render() {
        var title = ( <h2>Log On</h2> );
        var loader = this.props.logonPending
            ? ( <div>Loading</div> )
            : null;

        return (
            <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <Jumbotron>
                            <h2>We would like to know you</h2>
                        </Jumbotron>
                    </Col>
                    <Col xs={12} md={4}>
                        <Panel header={title} bsStyle="info">
                            <Input
                                type="text"
                                placeholder="Email or username"
                                hasFeedback
                                ref="userNameInput"/>
                            <Input
                                type="password"
                                placeholder="Password"
                                hasFeedback
                                ref="passwordInput"/>
                            <Button bsStyle="success" bzSize="large" className="btn-block" onClick={this.onClick.bind(this)} >
                                Log On
                            </Button>
                                {loader}
                            <div>{this.props.message}</div>
                            <Button bsStyle="facebook" bsSize="large" className="btn-block">
                                <i className="fa fa-facebook"></i> | Connect with Facebook
                            </Button>
                            <Button bsStyle="google-plus" bsSize="large" className="btn-block">
                                <i className="fa fa-google-plus"></i> | Connect with Google+
                            </Button>
                        </Panel>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

LogonPage.propTypes = {
    logonPending: PropTypes.bool.isRequired,
    message: PropTypes.string
};

function select(state) {
    return {
        logonPending: state.user.status == userStatus.logonPending,
        message: state.user.message
    };
}

export default connect(select)(LogonPage);

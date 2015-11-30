import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'
import membership from '../../api/membership'

class LogonPage extends Component {
    onClick() {
        const { userNameInput, passwordInput } = this.refs;
        const userName = userNameInput.getValue();
        const password = passwordInput.getValue();
        membership.login(userName, password);
    }
    
    facebook() {
        this.authExternalProvider('Facebook');
    }

    google() {
        this.authExternalProvider('Google');
    }

    authExternalProvider(provider) {
        const externalProviderUrl = membership.externalProviderUrl(provider);
        window.authenticationScope = { complete: membership.externalProviderCompleted };
        window.open(externalProviderUrl, "Authenticate Account", "location=0,status=0,width=600,height=750");
    }

    associateExternal() {
        const userName = this.refs.userNameInput.getValue();
        const { provider, externalAccessToken, externalUserName } = this.props;

        membership.registerExternal(userName, provider, externalAccessToken, externalUserName);
    }
    
    render() {
        var title = ( <h2>Log On</h2> );
        var loader = this.props.processing
            ? ( <div>Loading</div> )
            : null;

        var content = this.props.associateExternal
            ? (        
                <Panel header={title} bsStyle="info">
                    <div>
                        <p><strong>You have successfully authenticated with {this.props.provider} </strong>.</p>
                        <p>Please enter a user name below for this site and click the Register button to log in.</p>
                    </div>
                    <Input
                        type="text"
                        placeholder="User name"
                        hasFeedback
                        ref="userNameInput"/>
                    <Button bsStyle="success" bzSize="large" className="btn-block" onClick={this.associateExternal.bind(this)} >
                        Button
                    </Button>
                    {loader}
                    <div>{this.props.message}</div>
                </Panel>
              )
            : ( 
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
                        <Button bsStyle="facebook" bsSize="large" className="btn-block" onClick={this.facebook.bind(this)}>
                            <i className="fa fa-facebook"></i> | Connect with Facebook
                        </Button>
                        <Button bsStyle="google-plus" bsSize="large" className="btn-block" onClick={this.google.bind(this)}>
                            <i className="fa fa-google-plus"></i> | Connect with Google+
                        </Button> 
                    </Panel>
                );

        return (
            <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <Jumbotron>
                            <h2>We would like to know you</h2>
                        </Jumbotron>
                    </Col>
                    <Col xs={12} md={4}>
                            {content}
                    </Col>
                </Row>
            </Grid>
        );
    }
}

LogonPage.propTypes = {
    associateExternal: PropTypes.bool.isRequired,
    processing: PropTypes.bool.isRequired,
    message: PropTypes.string,
    provider: PropTypes.string,
    externalAccessToken: PropTypes.string,
    externalUserName: PropTypes.string
};

function select(state) {
    return {
        processing: state.user.processing,
        associateExternal: state.user.status === userStatus.associateExternal || state.user.status === userStatus.accociateExternalPending,
        message: state.user.message,
        provider: state.user.provider,
        externalAccessToken: state.user.externalAccessToken,
        externalUserName: state.user.externalUserName
    };
}

export default connect(select)(LogonPage);

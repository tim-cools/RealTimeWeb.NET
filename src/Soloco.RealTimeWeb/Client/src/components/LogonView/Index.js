import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import membership from '../../services/membership'

class LogonPage extends Component {
    
    componentDidMount() {
        membership.logonInit();
    }
    
    onClick() {
        const { userNameInput, passwordInput } = this.refs;
        const userName = userNameInput.getValue();
        const password = passwordInput.getValue();
        membership.logon(userName, password);
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

    render() {
        var title = ( <h2>Log On</h2> );
        var loader = this.props.pending
            ? ( <div>Loading</div> )
            : null;

        var errors = [];
        if (this.props.errors) {
            this.props.errors.map(message => errors.push(
                ( <div>{message}</div> )
                ));
        }

        var content = ( 
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
                        {errors}
                        <Button bsSize="large" className="btn-block btn-facebook" onClick={this.facebook.bind(this)}>
                            <i className="fa fa-facebook"></i> | Connect with Facebook
                        </Button>
                        <Button bsSize="large" className="btn-block btn-google-plus" onClick={this.google.bind(this)}>
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
    pending: PropTypes.bool.isRequired,
    errors: PropTypes.arrayOf(PropTypes.string),
    provider: PropTypes.string,
    externalAccessToken: PropTypes.string,
    externalUserName: PropTypes.string
};

function select(state) {
    return state.user.logon
        ? {
            pending: state.user.logon.pending ? true : false,
            errors: state.user.logon.errors
        } 
        : {
            pending: false
        };
}

export default connect(select)(LogonPage);

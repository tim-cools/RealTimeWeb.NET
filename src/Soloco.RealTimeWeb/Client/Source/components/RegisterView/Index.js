import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'
import membership from '../../api/membership'

class LogonPage extends Component {
    onClick() {
        const { userNameInput, eMailInput, passwordInput } = this.refs;
        const userName = userNameInput.getValue();
        const eMail = eMailInput.getValue();
        const password = passwordInput.getValue();
        membership.register(userName, eMail, password);
    }
    
    render() {
        var title = ( <h2>Register</h2> );
        var loader = this.props.processing
            ? ( <div>Loading</div> )
            : null;

        var content = 
                    <Panel header={title} bsStyle="info">
                        <Input
                            type="text"
                            placeholder="Username"
                            hasFeedback
                            ref="userNameInput"/>
                        <Input
                            type="email"
                            placeholder="Email"
                            hasFeedback  
                            ref="eMailInput"/>
                        <Input
                            type="password"
                            placeholder="Password"
                            hasFeedback
                            ref="passwordInput"/>
                        <Input
                            type="password"
                            placeholder="Repeat Password"
                            hasFeedback
                            ref="passwordInput"/>
                        <Button bsStyle="success" bzSize="large" className="btn-block" onClick={this.onClick.bind(this)} >
                            Register
                        </Button>
                            {loader}
                        <div>{this.props.message}</div>
                    </Panel>   
                ;

        return (
            <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <Jumbotron>
                            <h2>Join us</h2>
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
    processing: PropTypes.bool.isRequired,
    message: PropTypes.string,
};

function select(state) {
    return {
        processing: state.user.processing,
        message: state.user.message
    };
}

export default connect(select)(LogonPage);

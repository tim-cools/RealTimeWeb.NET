import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import membership from '../../api/membership'

class LogonPage extends Component {
    
    componentDidMount() {
        membership.registerInit();
    }
    
    onClick() {

        const { userNameInput, eMailInput, passwordInput,  confirmPasswordInput } = this.refs;
        const userName = userNameInput.getValue();
        const eMail = eMailInput.getValue();
        const password = passwordInput.getValue();
        const confirmPassword = confirmPasswordInput.getValue();

        membership.register(userName, eMail, password, confirmPassword);
    }

    render() {
        var title = ( <h2>Register</h2> );
        var loader = this.props.pending
            ? ( <div>Loading</div> )
            : null;

        
        var errors = [];
        if (this.props.errors) {
            this.props.errors.map(message => errors.push(
                ( <div>{message}</div> )
                ));
        }
        
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
                            placeholder="Confirm Password"
                            hasFeedback
                            ref="confirmPasswordInput"/>
                        <Button bsStyle="success" bzSize="large" className="btn-block" onClick={this.onClick.bind(this)} >
                            Register
                        </Button>
                        {loader}
                        {errors}
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
    pending: PropTypes.bool.isRequired,
    errors: PropTypes.arrayOf(PropTypes.string)
};

function select(state) {
    return state.user.register 
        ? {
            pending: state.user.register.pending,
            errors: state.user.register.errors
        } 
        : {
            pending: false         
        };
}

export default connect(select)(LogonPage);

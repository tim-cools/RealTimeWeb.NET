import React, { PropTypes, Component } from 'react';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'
//import userApi from '../../api/user'

class LogonPage extends Component {
    onClick() {
        const { dispatch } = this.props;
        const { userNameInput, passwordInput } = this.refs;
        var userName = userNameInput.getValue();
        var password = passwordInput.getValue();

        //userApi.login(userName, password);

        dispatch(actions.logonPending());
    }

    render() {
        var title = ( <h2>Log On</h2> );
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
                                ref="userName"/>
                            <Input
                                type="password"
                                placeholder="Password"
                                hasFeedback
                                ref="password"/>
                            <Button bsStyle="success" onClick={this.onClick.bind(this)} >
                                Log On
                            </Button>
                            { if (this.state.logonPending) {
                                    <Div>Loading<Div/>
                                }}
                        </Panel>

                    </Col>
                </Row>
            </Grid>
            );
    }
}

LogonPage.propTypes = {
    logonPending: PropTypes.bool.isRequired
};

function select(state) {
    return {
        logonPending: state.user.status == userStatus.logonPending
    };
}

export default connect(select)(LogonPage);

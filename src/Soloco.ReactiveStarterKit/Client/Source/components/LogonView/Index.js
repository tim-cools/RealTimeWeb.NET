import React, { PropTypes, Component } from 'react';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions } from '../../state/user'

class LogonPage extends Component {
    render() {
        const { dispatch, user } = this.props;
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
                                ref="userName"/>
                            <Button bsStyle="success">Log On</Button>
                        </Panel>
                    </Col>
                </Row>
            </Grid>
            );
    }
}

export default LogonPage;
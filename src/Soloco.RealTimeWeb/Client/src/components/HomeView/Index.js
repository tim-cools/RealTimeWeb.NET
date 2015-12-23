import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

import { actions as userActions, userStatus } from '../../state/user'

class HomePage extends Component {

    render() {
        var title = ( <h2>Activity</h2> );
        var loader = this.props.logonPending
            ? ( <div>Loading</div> )
            : null;

        return (
            <Grid>
                <Row className="show-grid">
                    <Col xs={12} md={8}>
                        <Jumbotron>
                            <h2>Home sweet home</h2>
                        </Jumbotron>
                    </Col>
                    <Col xs={12} md={4}>
                        <Panel header={title} bsStyle="info">
                        </Panel>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

HomePage.propTypes = {
    allowed: PropTypes.bool.isRequired,
};

function select(state) {
    return {
        allowed: state.user.status === userStatus.authenticated
    };
}

export default connect(select)(HomePage);

let React = require('react');
import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';

let About = React.createClass({

    render() {
        return (<Grid>
                    <Row>
                        <Col xs={12} md={8}>Here comes more info</Col>
                    </Row>
                </Grid>);
    },
});

module.exports = About;
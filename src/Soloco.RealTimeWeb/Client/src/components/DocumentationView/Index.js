import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';
import Markdown from 'react-remarkable';
import Navigation from './Navigation';

import documentation from '../../services/documentation'

export class View extends Component {
    
    componentDidMount() {
        documentation.getDocuments();
    }
	
    componentDidUpdate() {
        if (this.props.id && !this.props.document) {
            documentation.getDocument(this.props.id);
        }
    }

    getMain() {
        return this.refs.main;
    }

    render() {
        return (
            <Grid>
                <Row>
                    <Col md={3}>
                        <Navigation documents={this.props.headers} main={this.getMain.bind(this)} />
                    </Col>
                    <Col md={9}>
                        <Markdown ref="main" source={this.props.document} />
                    </Col>
                </Row>
            </Grid>
        );
    }
}

View.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string),
    id: PropTypes.string,
    document: PropTypes.string,
};

export function mapStateToProps(state, props) {
    const documentation = state.documentation;
    const id = props && props.routeParams ? props.routeParams.id : null;
    return {
        headers: documentation.headers ? documentation.headers : [],
        id: id,
        document: id && documentation.documents && documentation.documents[id]
            ?  documentation.documents[id]
            : null
    };
}

export default connect(mapStateToProps)(View);
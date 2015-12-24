import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';
import Markdown from 'react-remarkable';
import Navigation from './Navigation';

import documentation from '../../api/documentation'

export class View extends Component {
    
    componentDidMount() {
        documentation.getDocuments();
    }
    
    render() {
        return (
            <Row>
                <Col md={3}>
                    <Navigation documents={this.props.headers}>
                    </Navigation>
                </Col>
                <Col md={9}>
                    <Markdown source="{this.props.current}" />
                </Col>
            </Row>
        );
    }
}

View.propTypes = {
    documents: PropTypes.arrayOf(PropTypes.string),
    current: PropTypes.string
};

export function mapStateToProps(state) {
    const documentation = state.documentation;
    return {
        headers: documentation.headers ? documentation.headers : null,
        current: documentation.currentDocumentIndex && documentation.documents[documentation.currentDocumentIndex] 
            ?  documentation.documents[documentation.currentDocumentIndex].content
            : null
    };
}

export default connect(mapStateToProps)(View);
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Input, Button, Panel, Grid, Row, Col, Jumbotron } from 'react-bootstrap';
import Markdown from 'react-remarkable';
import Navigation from './Navigation';

import documentation from '../../api/documentation'

class Index extends Component {
    
    componentDidMount() {
        documentation.getDocuments();
    }
    
    render() {
        return (
            <Row>
                <Col md={3}>
                    <Navigation documents={this.props.documents}>
                    </Navigation>
                </Col>
                <Col md={9}>
                    <Markdown source="{this.props.current}" />
                </Col>
            </Row>
        );
    }
}


Index.propTypes = {
    documents: PropTypes.arrayOf(PropTypes.string),
    current: PropTypes.string
};

function select(state) {
    const documentation = state.documentation;
    return {
        documents: documentation.documents,
        current: documentation.documents[documentation.currentDocumentIndex] 
            ?  documentation.documents[documentation.currentDocumentIndex].content
            : null
    };
}

export default connect(select)(Index);
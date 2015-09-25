import React, { PropTypes, Component } from 'react';

var separatorStyle = {
    'border-bottom': '1px solid #ccc',
    'font-size': '1px',
    'height': '8px',
    'margin-bottom': '8px'
};

class Footer extends Component {
    render() {
        return (
            <div>
                <div style={separatorStyle}/>
                <div>© 2015 Soloco</div>
            </div>
        );
    }
}

module.exports = Footer;
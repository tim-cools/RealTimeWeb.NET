import React, { PropTypes, Component } from 'react';

var separatorStyle = {
    borderBottom: '1px solid #ccc',
    fontSize: '1px',
    height: '8px',
    marginBottom: '8px'
};

class Footer extends Component {
    render() {
        return (
            <div>
                <div style={separatorStyle}/>
                <div>© 2015-2016 Soloco</div>
            </div>
        );
    }
}

module.exports = Footer;
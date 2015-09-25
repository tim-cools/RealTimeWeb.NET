import React, { PropTypes, Component } from 'react';

import styles from './Footer.less';
//import withStyles from '../../decorators/withStyles.js';

class Footer extends Component {
    render() {
        return (
            <div className="footer">
                <div className="separator" />
                <div>Soloco 2015</div>
            </div>
        );
    }
}

module.exports = Footer;
import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';

class Header extends Component {
    render() {
        const { dispatch, user, onLogonClick, onLogoffClick } = this.props;

        var items = user.authenticated
            ? [ (
                <Nav>
                    <NavItem>authenticated: {  user.name }</NavItem>
                </Nav>
                ), (
                <Nav right={true}>
                    <NavItem onSelect={onLogoffClick}>
                        Log Off
                    </NavItem>
                </Nav>
                ) ]
            :   (
                <Nav right={true}>
                    <NavItem onSelect={onLogonClick}>
                    Log On
                    </NavItem>
                </Nav>
                );

        return (
            <Navbar brand="Soloco - Reactive Starter Kit">
                {items}
            </Navbar>
        );
    }
}

Header.propTypes = {
    onLogonClick: PropTypes.func.isRequired,
    onLogoffClick: PropTypes.func.isRequired,
    user: PropTypes.shape({
        authenticated: PropTypes.bool.isRequired,
        name: PropTypes.string
    }).isRequired
};

export default Header;

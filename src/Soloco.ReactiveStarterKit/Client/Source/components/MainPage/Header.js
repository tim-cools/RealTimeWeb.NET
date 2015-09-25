import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';

class Header extends Component {
    render() {
        const { dispatch, userAuthenticated, userName, onLogonClick, onLogoffClick } = this.props;

        var items = userAuthenticated
            ? [ (
                <Nav>
                    <NavItem>authenticated: {  userName }</NavItem>
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

    userAuthenticated: PropTypes.bool.isRequired,
    userName: PropTypes.string
};

export default Header;

import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import { Navbar, NavBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';
import navigate from './../../api/navigate';
import membership from './../../api/membership';

class Header extends Component {
    render() {
        const { userAuthenticated, userName } = this.props;

        var items = userAuthenticated
            ? [ (
                <Nav>
                    <NavItem>authenticated: {  userName }</NavItem>
                </Nav>
                ), (
                <Nav right={true}>
                    <NavItem onSelect={() => membership.logOff()}>
                        Log Off
                    </NavItem>
                </Nav>
                ) ]
            :   (
                <Nav right={true}>
                    <NavItem onSelect={() => navigate.to('/logon')}>
                    Log On
                    </NavItem>
                </Nav>
                );

        return (
            <Navbar>
                <NavBrand>Soloco - Reactive Starter Kit</NavBrand>
                {items}
            </Navbar>
        );
    }
}

Header.propTypes = {
    userAuthenticated: PropTypes.bool.isRequired,
    userName: PropTypes.string
};

export default Header;

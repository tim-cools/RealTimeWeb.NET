import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import { Navbar, NavbarBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';
import navigate from './../../api/navigate';
import membership from './../../api/membership';

class Header extends Component {
    
    render() {
        const { userAuthenticated, userName } = this.props;

        var items = userAuthenticated
            ? [ (
                <Nav onSelect={(key, href) =>navigate.to(href)}>
                    <NavItem href='/home'>Home</NavItem>
                    <NavItem href='/documentation'>Documentation</NavItem>
                    <NavItem href='/about'>About</NavItem>
                </Nav>
                ), (
                <Nav pullRight={true} onSelect={(key, href) =>navigate.to(href)}>
                    <NavItem href='/profile'>{ userName }</NavItem>
                    <NavItem onSelect={() => membership.logOff()}>
                        Log Off
                    </NavItem>
                </Nav>
                ) ]
            :  [ (
                <Nav onSelect={(key, href) => navigate.to(href)}>
                    <NavItem href='/documentation'>Documentation</NavItem>
                    <NavItem href='/about'>About</NavItem>
                </Nav>
                ), (
                <Nav pullRight={true}>
                    <NavItem onSelect={() => navigate.to('/register')}>
                    Join
                    </NavItem>
                    <NavItem onSelect={() => navigate.to('/logon')}>
                    Log On
                    </NavItem>
                </Nav>
                ) ];

        return (
            <Navbar>
                <NavbarBrand>Soloco - Real Time Web .NET</NavbarBrand>
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

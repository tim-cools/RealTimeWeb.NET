import { PropTypes, Component } from 'react';

import { Navbar, NavBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';

class Navigation extends Component {

    getInitialState() {
        return {
            activeNavItemHref: null
        };
    }

    getMain() {
        return this.refs.main;
    }

    handleNavItemSelect(key, href) {
        window.location = href;
        this.setActiveNavItem();
    }

    componentDidMount() {
        this.setActiveNavItem();
    }

    setActiveNavItem(href = window.location.hash) {
        this.setState({
            activeNavItemHref: href
        });
    }

    render() {
      
        return (
            <div className="bs-docs-sidebar hidden-print" role="complementary">

                <Nav
                    className="bs-docs-sidenav"
                    activeHref={this.state.activeNavItemHref}
                    onSelect={this.handleNavItemSelect}>
                    
                        <SubNav href={sections.buttons} text="Buttons">
                            <NavItem href={sections.btnGroups}>Button groups</NavItem>
                            <NavItem href={sections.dropdowns}>Dropdowns</NavItem>
                            <NavItem href={sections.menuitems}>Menu items</NavItem>
                        </SubNav>
                 </Nav
            </div>
        );
    }
}

Navigation.propTypes = {
    documents: PropTypes.arrayOf(PropR.string)
};

export default Navigation;

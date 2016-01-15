import React, { PropTypes, Component } from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { Container } from 'react-bootstrap-grid';
import AutoAffix from 'react-overlays/lib/AutoAffix';
import SubNav from './SubNav'
import navigate from './../../api/navigate';

class Navigation extends Component {

    constructor(props) {
        super(props);
        
        this.state = { activeNavItemHref: null };
    }

    handleNavItemSelect(key, href) {
        navigate.to(href);
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

        var child =  !this.props.documents 
            ? <div>Loading</div>
            : typeof(this.props.documents) === 'string'
            ?  <div>{this.props.documents}</div>
            : (
                <AutoAffix viewportOffsetTop={20} container={this.props.main} >
                    <Nav activeHref={this.state.activeNavItemHref}
                         onSelect={this.handleNavItemSelect}>
                        {this.props.documents.map(function(document, i) {
                            return (<SubNav text={document.Name} href={"/documentation/" + document.Id}>
                                {document.Children ? document.Children.map(function(childDocument, i) {
                                    return <NavItem href={"/documentation/" + childDocument.Id} >{childDocument.Name}</NavItem>;
                                }) : null}
                                </SubNav>
                            );
                        })}
                    </Nav>
                </AutoAffix>
            );
      
        return (
            <div className="bs-docs-sidebar hidden-print" role="complementary">
                {child}
            </div>
        );
    }
}

Navigation.propTypes = {
    documents: PropTypes.arrayOf(PropTypes.string),
    main: PropTypes.func
};

export default Navigation;

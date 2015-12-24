import expect from 'expect';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions } from '../../src/state/documentation';
import reducers from '../../src/state/reducers';
import { View, mapStateToProps } from '../../src/components/DocumentationView';
import React from 'React';
import TestUtils from 'react-addons-test-utils';

describe('Components', () => {
    describe('DocumentationView', () => {

        describe('Props', () => {

            let store;
            
            beforeEach(function() {
                store = createStore(reducers);
                dispatcher.set(store.dispatch);

            });
            
            function assertProps(expected) {
                const props = mapStateToProps(store.getState());
                expect(props).toEqual(expected);
            }

            it('should have the default props', () => {
               assertProps({
                    current: null,
                    headers: null
                });
            });

            it('should have the header when documents are loaded', () => {
                actions.loaded([ 'h1', 'h2' ]);
                assertProps({
                    current: null,
                    headers: [ 'h1', 'h2' ]
                });
            });
        });

        /* TODO add tests that verify the rendering
        describe('Structure', () => {

            var store;
            var renderer;

            beforeEach(function() {
                renderer = TestUtils.createRenderer();
                store = createStore(reducers);
                dispatcher.set(store.dispatch);
            });

            function assertStructure(type, children) {
                var props = mapStateToProps(store.getState());
                renderer.render(React.createElement(View), props);
                let view = renderer.getRenderOutput();
                console.log(view);
                expect(view.type.displayName).toBe(type);
                expect(view.props.children).toEqual(children);
            }

            it('should have the default props', () => {
                assertStructure('Row', [
                    <Col md={3}>
                        <Navigation documents={this.props.headers}>
                    </Navigation>
                    </Col>,
                    <Col md={9}>
                        <Markdown source="{this.props.current}" />
                    </Col>
                ]);
            });

            it('should have the header when documents are loaded', () => {
                assertStructure('Row', [
                   <span className="heading">Title</span>
                ]);
            });
        }); */
    });
});

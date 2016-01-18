import expect from 'expect';
import sinon from 'sinon';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions } from '../../src/state/documentation';
import reducers from '../../src/state/reducers';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import rewire from "rewire";
import { View, mapStateToProps, __RewireAPI__ as DocumentationViewRewireAPI  } from '../../src/components/DocumentationView';

describe('Components', () => {
    describe('DocumentationView', () => {

        describe('Props', () => {

            let store;
            
            beforeEach(function() {
                store = createStore(reducers);
                dispatcher.set(store.dispatch);
            });
            
            function assertProps(expected, id) {
                const params = id ? { routeParams: { id: id} } : null;
                const props = mapStateToProps(store.getState(), params);
                expect(props).toEqual(expected);
            }

            it('should have the default props', () => {
               assertProps({
                   document: null,
                   id: null,
                   headers: null
                });
            });

            it('should have the header when documents are loaded', () => {
                actions.loaded([ 'h1', 'h2' ]);
                assertProps({
                    document: null,
                    id: null,
                    headers: [ 'h1', 'h2' ]
                });
            });

            it('should have the header when document is loaded', () => {
                actions.documentLoaded('1', { content:'c'});
                assertProps({
                    document: { content:'c'},
                    id: '1',
                    headers: null
                }, '1');
            });

            it('should have the header when document failed to load', () => {
                actions.documentError('1', 'c');
                assertProps({
                    document: 'c',
                    id: '1',
                    headers: null
                }, '1');
            });
        });

        describe('Render', () => {

            var store;

            beforeEach(function() {
                store = createStore(reducers);
                dispatcher.set(store.dispatch);

                //Mock the documentation import (we don't want to acces the real API)
                const documentationMock = { getDocuments: () => {}};
                DocumentationViewRewireAPI.__Rewire__("documentation", documentationMock);
            });

            function assertRender() {
                const props = mapStateToProps(store.getState());
                const view = TestUtils.renderIntoDocument(<View />, props);
                const viewNode = ReactDOM.findDOMNode(view);
            }

            it('should build without problems', () => {
                assertRender();
            });
        });
    });
});

//import assert from 'assert';
//import { createStore } from 'redux';
//import dispatcher from '../../src/state/dispatcher';
//import { actions } from '../../src/state/user';
//import reducers from '../../src/state/reducers';
//import View from '../../src/components/LogonView';
//import React from 'react/addons';

//const TestUtils = React.addons.TestUtils;
//const renderer = TestUtils.createRenderer();


//describe('Components', () => {
//    describe('LogonView', () => {
    
//        var store;
//        beforeEach(function() {
//            store = createStore(reducers);
//            dispatcher.set(store.dispatch);
//        });

//        function assertProps(expected) {
//            renderer.render(React.createElement(View), { store: store });
//            let view = renderer.getRenderOutput();
//            let ignoreDispatchProperty = { ...expected, dispatch: view.props.dispatch };
//            assert.deepEqual(view.props, ignoreDispatchProperty);
//        }

//        it('should have a default state', () => {
//            assertProps({ 
//                associateExternal: false,
//                pending: false
//            });
//        });

//        it('should have be able to view associateExternal', () => {
//            actions.associateExternal('p', 'a', 'd');
//            assertProps({
//                associateExternal: true,
//                errors: null,
//                externalAccessToken: 'a',
//                externalUserName: 'd',
//                pending: false
//            });
//        });
//    });
//});
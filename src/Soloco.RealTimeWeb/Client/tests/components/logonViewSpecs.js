import assert from 'assert';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions } from '../../src/state/documentation';
import reducers from '../../src/state/reducers';
import View from '../../src/components/LogonView';
import React from 'react/addons';

const TestUtils = React.addons.TestUtils;
const shallowRenderer = TestUtils.createRenderer();


describe('Components', () => {
    describe('LogonView', () => {
    
        var store;
        beforeEach(function() {
            store = createStore(reducers);
            dispatcher.set(store.dispatch);
            shallowRenderer.render(React.createElement(View), { store: store });
        });
        
        function assertProps(expected) {
            let view = shallowRenderer.getRenderOutput();
            let ignoreDispatchProperty = { ...expected, dispatch: view.props.dispatch };
            assert.deepEqual(view.props, ignoreDispatchProperty);
        }

        it('should de able to render', () => {
            assertProps({ 
                associateExternal: false,
                pending: false
            });
        });
    });
});
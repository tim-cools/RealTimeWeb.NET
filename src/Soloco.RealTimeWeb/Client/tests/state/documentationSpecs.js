import assert from 'assert';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions } from '../../src/state/documentation';
import reducers from '../../src/state/reducers';

describe('State', () => {
    describe('Documentation', () => {
    
        var store;
        beforeEach(function() {
            store = createStore(reducers);
            dispatcher.set(store.dispatch);
        });

        function assertState(expected) {
            var state = store.getState();
            assert.deepEqual(state.documentation, expected);
        }

        it('should have an empty state by default', () => {
            assertState({});
        });
    
        it('should have the loaded document header', () => {
            actions.loaded({ a: 1, b: 2, c: 3 });
            assertState({
                headers: { a: 1, b: 2, c: 3 }
            });
        });
    
        it('should have the loading error', () => {
            actions.error("error");
            assertState({
                headers: "error"
            });
        });

        it('should have a loaded document', () => {
            actions.documentLoaded("id1", "This is the document");
            assertState({
                headers: undefined,
                documents: {
                    id1: "This is the document"
                }
            });
        });
    
        it('should have an updated document', () => {
            actions.documentLoaded("id1", "This is the document 1");
            actions.documentLoaded("id2", "This is the document 2");
            actions.documentLoaded("id1", "This is the document 1 U");
            assertState({
                headers: undefined,
                documents: {
                    id1: "This is the document 1 U",
                    id2: "This is the document 2"
                }
            });
        });
    
        it('should have a document error', () => {
            actions.documentLoaded("id1", "This is the document 1");
            actions.documentLoaded("id2", "This is the document 2");
            actions.documentError("id1", "This is the error");
            assertState({
                headers: undefined,
                documents: {
                    id1: "This is the error",
                    id2: "This is the document 2"
                }
            });
        });
    });
});
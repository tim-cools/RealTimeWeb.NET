import assert from 'assert';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions, userStatus } from '../../src/state/user';
import reducers from '../../src/state/reducers';

describe('State', () => {
    describe('User', () => {
    
        var store;
        beforeEach(function() {
            store = createStore(reducers);
            dispatcher.set(store.dispatch);
        });

        function assertState(expected) {
            const state = store.getState();
            assert.deepEqual(expected, state.user);
        }

        it('should should be notAuthenticated by default', () => {
            assertState({
                status: userStatus.notAuthenticated
            });
        });

        it('should should be able to login succesful', () => {
            actions.loggedOn('tim', true);
            assertState({
                status: userStatus.authenticated,
                name: 'tim'
            });
        });

        it('should should be able to start login', () => {
            actions.logon();
            assertState({
                status: userStatus.notAuthenticated,
                logon: {}
            });
        });

        it('should should be able to login pending', () => {
            actions.logonPending();
            assertState({
                status: userStatus.notAuthenticated,
                logon: {    
                    pending: true
                }
            });
        });   

        it('should should be able to fail login', () => {
            actions.logonFailed([ 'error1', 'error2' ]);
            assertState({
                status: userStatus.notAuthenticated,
                logon: {
                    errors: [ 'error1', 'error2' ]
                }
            });
        });   

        it('should should be able to logoff', () => {
            actions.loggedOn('tim', true);
            actions.logoff();
            assertState({
                status: userStatus.notAuthenticated
            });
        });   

        it('should should be able to register', () => {
            actions.register();
            assertState({
                status: userStatus.notAuthenticated,
                register: {}
            });
        });   

        it('should should be able to pending register', () => {
            actions.registerPending();
            assertState({
                status: userStatus.notAuthenticated,
                register: {
                    pending: true
                }
            });
        });   

        it('should should be able to fail register', () => {
            actions.registerFailed([ 'error1', 'error2' ]);
            assertState({
                status: userStatus.notAuthenticated,
                register: {
                    errors: [ 'error1', 'error2' ]
                }
            });
        });   
        
        it('should should be able to associate external', () => {
            actions.associateExternal('provider', 'externalAccessToken', 'externalUserName');
            assertState({
                status: userStatus.notAuthenticated,
                associateExternal: {
                    token: 'externalAccessToken',
                    provider: 'provider',
                    userName: 'externalUserName'
                }
            });
        });   

        it('should should be able to associate external pending', () => {
            actions.associateExternal('provider', 'externalAccessToken', 'externalUserName');
            actions.associateExternalPending();
            assertState({
                status: userStatus.notAuthenticated,
                associateExternal: {
                    pending: true,
                    token: 'externalAccessToken',
                    provider: 'provider',
                    userName: 'externalUserName'
                }
            });
        });   

        it('should should be able to associate external failed', () => {
            actions.associateExternal('provider', 'externalAccessToken', 'externalUserName');
            actions.associateExternalFailed([ 'error1', 'error2' ]);
            assertState({
                status: userStatus.notAuthenticated,
                associateExternal: {
                    token: 'externalAccessToken',
                    provider: 'provider',
                    userName: 'externalUserName',
                    errors: [ 'error1', 'error2' ]
                }
            });
        });   
    });
});
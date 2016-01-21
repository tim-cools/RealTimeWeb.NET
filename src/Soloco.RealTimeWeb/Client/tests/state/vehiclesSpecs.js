import expect from 'expect';
import { createStore } from 'redux';
import dispatcher from '../../src/state/dispatcher';
import { actions, userStatus } from '../../src/state/vehicles';
import reducers from '../../src/state/reducers';

describe('State', () => {
    describe('vehicles', () => {
    
        var store;
        beforeEach(function() {
            store = createStore(reducers);
            dispatcher.set(store.dispatch);
        });

        function assertState(expected) {
            var state = store.getState();
            expect(state.vehicles).toEqual(expected);
        }

        it('should be empty by default', () => {
            assertState({ });
        });
        
        it('should drive from origin to destination', () => {

            actions.driving('1', 'n1', 'o1', 'd1');

            assertState({
                '1': { id: '1', name: 'n1', state: 'Driving from o1 to d1' }
            });
        });

        it('driver should override previous drive', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.driving('2', 'n2', 'o2', 'd2');
            actions.driving('1', 'n1', 'o3', 'd3');

            assertState({
                '1': { id: '1', name: 'n1', state: 'Driving from o3 to d3' },
                '2': { id: '2', name: 'n2', state: 'Driving from o2 to d2' }
            });
        });

        it('moved should set position', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.moved('1', 'n1', 1.2, 3.4);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Driving from o1 to d1', latitude: 1.2, longitude: 3.4 }
            });
        });

        it('moved should overide previous set position', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.moved('1', 'n1', 1.2, 3.4);
            actions.moved('1', 'n1', 5.6, 7.8);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Driving from o1 to d1', latitude: 5.6, longitude: 7.8 }
            });
        });

        it('stopped should set state and position', () => {

            actions.stopped('1', 'n1', 'l1', 1.2, 3.4);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Stillstand in l1',latitude: 1.2, longitude: 3.4 }
            });
        });

        it('stopped should set state and position (multiple)', () => {

            actions.stopped('1', 'n1', 'l1', 1.2, 1.4);
            actions.stopped('2', 'n2', 'l2', 2.2, 2.4);
            actions.stopped('3', 'n3', 'l3', 3.2, 3.4);
            actions.stopped('4', 'n4', 'l4', 4.2, 4.4);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Stillstand in l1', latitude: 1.2, longitude: 1.4 },
                '2': { id: '2', name: 'n2', state: 'Stillstand in l2', latitude: 2.2, longitude: 2.4 },
                '3': { id: '3', name: 'n3', state: 'Stillstand in l3', latitude: 3.2, longitude: 3.4 },
                '4': { id: '4', name: 'n4', state: 'Stillstand in l4', latitude: 4.2, longitude: 4.4 }
            });
        });
        
        it('stopped and moved should set state and position (multiple)', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.driving('2', 'n2', 'o2', 'd2');
            actions.driving('3', 'n3', 'o2', 'd3');
            actions.driving('4', 'n4', 'o2', 'd4');

            actions.moved('1', 'n1', 1.2, 1.4);
            actions.moved('2', 'n2', 2.2, 2.4);
            actions.moved('3', 'n3', 3.2, 3.4);

            actions.stopped('1', 'n1', 'l1', 11.2, 11.4);
            actions.stopped('2', 'n2', 'l2', 12.2, 12.4);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Stillstand in l1', latitude: 11.2, longitude: 11.4 },
                '2': { id: '2', name: 'n2', state: 'Stillstand in l2', latitude: 12.2, longitude: 12.4 },
                '3': { id: '3', name: 'n3', state: 'Driving from o2 to d3', latitude: 3.2, longitude: 3.4 },
                '4': { id: '4', name: 'n4', state: 'Driving from o2 to d4' }
            });
        });
        
        it('stopped should overide previous set position', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.moved('1', 'n1', 1.2, 3.4);
            actions.stopped('1', 'n1', 'l1', 5.6, 7.8);

            assertState({
                '1': { id: '1', name: 'n1', state: 'Stillstand in l1', latitude: 5.6, longitude: 7.8 }
            });
        });
    
        it('driving should overide previous set position', () => {

            actions.driving('1', 'n1', 'o1', 'd1');
            actions.moved('1', 'n1', 1.2, 3.4);
            actions.stopped('1', 'n1', 'l1', 5.6, 7.8);
            actions.driving('1', 'n1', 'd1', 'd2');

            assertState({
                '1': { id: '1', name: 'n1', state: 'Driving from d1 to d2', latitude: 5.6, longitude: 7.8 }
            });
        });

    });
});
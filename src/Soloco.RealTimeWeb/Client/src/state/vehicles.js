import { dispatch } from './dispatcher';

export const actionsDefinitions = {
    VEHICLE_DRIVING: 'VEHICLE_DRIVING',
    VEHICLE_MOVED: 'VEHICLE_MOVED',
    VEHICLE_STOPPED: 'VEHICLE_STOPPED'
};

export const actions = {
    driving: function(id, name, origin, destination) {
        return dispatch({
            type: actionsDefinitions.VEHICLE_DRIVING,
            id: id,
            name: name,
            origin: origin,
            destination: destination
        });
    },

    moved: function(id, name, latitude, longitude) {
        return dispatch({
            type: actionsDefinitions.VEHICLE_MOVED,
            id: id,
            name: name,
            latitude: latitude,
            longitude: longitude
        });
    },

    stopped: function(id, name, location, latitude, longitude) {
        return dispatch({
            type: actionsDefinitions.VEHICLE_STOPPED,
            id: id,
            name: name,
            location: location,
            latitude: latitude,
            longitude: longitude
        });
    }
};

export function reducer(state = {}, action) {
    switch (action.type) {
        case actionsDefinitions.VEHICLE_DRIVING:
            var vehicles = { ...state };
            vehicles[action.id] = {
                ...vehicles[action.id],
                id: action.id,
                name: action.name,
                state: 'Driving from ' + action.origin + ' to ' + action.destination,
            };
            return vehicles;

        case actionsDefinitions.VEHICLE_MOVED:
            var vehicles = { ...state };
            vehicles[action.id] = { 
                ...vehicles[action.id],
                id: action.id,
                name: action.name,
                latitude: action.latitude,
                longitude: action.longitude
            };
            return vehicles;

        case actionsDefinitions.VEHICLE_STOPPED:
            var vehicles = { ...state };
            vehicles[action.id] = {
                state: 'Stillstand in ' + action.location,
                id: action.id,
                name: action.name,
                latitude: action.latitude,
                longitude: action.longitude
            };
            return vehicles;

        default:
            return state;
    }
};
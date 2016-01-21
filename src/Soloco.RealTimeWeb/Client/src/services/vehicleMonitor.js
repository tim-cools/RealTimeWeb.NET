import { actions as vehiclesStateActions } from '../state/vehicles';

const proxy = $.connection.vehicleMonitor;

function initialize() {

    proxy.client.vehicleDriving = function(data) {
        vehiclesStateActions.driving(data.id, data.name, data.origin, data.destination);
    };

    proxy.client.vehicleMoved = function(data) {
        vehiclesStateActions.moved(data.id, data.name, data.latitude, data.longitude);
    };

    proxy.client.vehicleStopped = function(data) {
        vehiclesStateActions.stopped(data.id, data.name, data.location, data.latitude, data.longitude);
    };

}

function startListening() {
    $.connection.hub.start()
        .done(function() { console.log('VehicleMonitor hub connected, connection ID=' + $.connection.hub.id); })
        .fail(function() { console.log('Could not Connect!'); });
}

function stopListening() {
    $.connection.hub.stop()
        .done(function() { console.log('VehicleMonitor hub stopped'); })
        .fail(function() { console.log('Could not Connect!'); });
}

export default {
    initialize: initialize,
    startListening: startListening,
    stopListening: stopListening
}
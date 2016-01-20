import { actions as userStateActions } from '../state/user';

const proxy = $.connection.vehicleMonitor;

function initialize() {
    proxy.client.vehicleDriving = function(data) {
        console.log(data);
    };

    $.connection.hub.start()
        .done(function() { console.log('VehicleMonitor hub connected, connection ID=' + $.connection.hub.id); })
        .fail(function() { console.log('Could not Connect!'); });
}

export default {
    initialize: initialize
}
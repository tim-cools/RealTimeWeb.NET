using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle
{
    public class VehicleMoved
    {
        public Guid VehicleId { get; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public VehicleMoved(Guid vehicleId, double latitude, double longitude)
        {
            VehicleId = vehicleId;
            Latitude = latitude;
            Longitude = longitude;
        }

        public override string ToString()
        {
            return $"VehicleMoved - VehicleId: {VehicleId}, Latitude: {Latitude}, Longitude: {Longitude}";
        }
    }
}
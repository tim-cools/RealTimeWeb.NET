using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle
{
    public class VehicleMoved
    {
        public Guid VehicleId { get; }
        public string VehicleName { get; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public VehicleMoved(Guid vehicleId, string vehicleName, double latitude, double longitude)
        {
            VehicleId = vehicleId;
            VehicleName = vehicleName;
            Latitude = latitude;
            Longitude = longitude;
        }

        public override string ToString()
        {
            return $"VehicleMoved - VehicleId: {VehicleId}, VehicleName: {VehicleName}, Latitude: {Latitude}, Longitude: {Longitude}";
        }
    }
}
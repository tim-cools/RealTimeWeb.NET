﻿using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle
{
    public class VehicleStopped
    {
        public Guid VehicleId { get; }
        public string VehicleName { get; }
        public string Location { get; }
        public double Latitude { get; }
        public double Longitude { get; }

        public VehicleStopped(Guid vehicleId, string vehicleName, string location, double latitude, double longitude)
        {
            VehicleId = vehicleId;
            VehicleName = vehicleName;
            Location = location;
            Latitude = latitude;
            Longitude = longitude;
        }

        public override string ToString()
        {
            return $"VehicleStopped - VehicleId: {VehicleId}, VehicleName: {VehicleName}, Location: {Location}, Latitude: {Latitude}, Longitude: {Longitude}";
        }
    }
}
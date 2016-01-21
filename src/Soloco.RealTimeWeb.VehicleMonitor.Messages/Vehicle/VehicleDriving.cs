using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle
{
    public class VehicleDriving
    {
        public Guid VehicleId { get;  }
        public string VehicleName { get; }
        public string Origin { get;  }
        public string Destination { get; }

        public VehicleDriving(Guid vehicleId, string vehicleName, string origin, string destination)
        {
            VehicleId = vehicleId;
            VehicleName = vehicleName;
            Origin = origin;
            Destination = destination;
        }

        public override string ToString()
        {
            return $"VehicleDriving - VehicleId: {VehicleId}, VehicleName: {VehicleName}, Origin: {Origin}, Destination: {Destination}";
        }
    }
}
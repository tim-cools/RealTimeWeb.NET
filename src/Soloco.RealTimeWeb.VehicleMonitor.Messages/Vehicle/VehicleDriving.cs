using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle
{
    public class VehicleDriving
    {
        public Guid VehicleId { get;  }
        public string Origin { get;  }
        public string Destination { get; }

        public VehicleDriving(Guid vehicleId, string origin, string destination)
        {
            VehicleId = vehicleId;
            Origin = origin;
            Destination = destination;
        }

        public override string ToString()
        {
            return $"VehicleDriving - VehicleId: {VehicleId}, Origin: {Origin}, Destination: {Destination}";
        }
    }
}
using System;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class DrivingState : VehicleState
    {
        private readonly VehicleSimulationContext _context;

        public DrivingState(VehicleSimulationContext context)
        {
            Console.WriteLine("Driving:" + context.VehicleId);

            _context = context;

            var route = _context.Route;
            _context.PublishEvent(new VehicleDriving(_context.VehicleId, route.Origin.Name, route.Destination.Name));
        }

        public override VehicleState Update()
        {
            var route = _context.Route;
            var position = route.NextPosition();

            if (position != null)
            {
                _context.PublishEvent(new VehicleMoved(_context.VehicleId, position.Latitude, position.Longitude));
            }

            if (route.IsFinishd())
            {
                _context.ArrivedAt(_context.Route.Destination);
                return new StandStillState(_context);
            }

            return this;
        }
    }
}
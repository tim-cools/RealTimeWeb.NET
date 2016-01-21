using System;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class StandStillState : VehicleState
    {
        private readonly VehicleSimulationContext _context;
        private readonly DateTime? _pauseOver;

        public StandStillState(VehicleSimulationContext context)
        {
            Console.WriteLine("StandStill:" + context.VehicleId);

            _context = context;
            _pauseOver = DateTime.Now.AddSeconds(context.Random.Next(20));
            _context.PublishEvent(new VehicleStopped(context.VehicleId, context.Location.Name, context.Location.Position.Latitude, context.Location.Position.Longitude));
        }

        public override VehicleState Update()
        {
            if (_pauseOver >= DateTime.Now)
            {
                return new PlanningState(_context);
            }
            return this;
        }
    }
}
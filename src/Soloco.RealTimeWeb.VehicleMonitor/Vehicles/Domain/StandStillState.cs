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
            _context = context;
            _pauseOver = DateTime.Now.AddSeconds(context.Random.Next(20));

            Console.WriteLine("StandStill:" + context.VehicleId + " (Wait until " + _pauseOver + ")");
            _context.PublishEvent(new VehicleStopped(context.VehicleId, _context.Name, context.Location.Name, context.Location.Position.Latitude, context.Location.Position.Longitude));
        }

        public override VehicleState Update()
        {
            Console.WriteLine("Update StandStill (Wait until " + _pauseOver + ") "  + DateTime.Now);
            if (DateTime.Now >= _pauseOver)
            {
                return new PlanningState(_context);
            }
            return this;
        }
    }
}
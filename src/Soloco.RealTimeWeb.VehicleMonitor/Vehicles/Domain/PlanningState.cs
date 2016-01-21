using System;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class PlanningState : VehicleState
    {
        private readonly VehicleSimulationContext _context;

        public PlanningState(VehicleSimulationContext context)
        {
            Console.WriteLine("Planning:" + context.VehicleId);

            _context = context;
            _context.PlanNextRoute();
        }

        public override VehicleState Update()
        {
            if (_context.IsRoutePlanned())
            {
                return new DrivingState(_context);
            }

            return this;
        }
    }
}
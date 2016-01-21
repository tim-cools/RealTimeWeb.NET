using System;
using MassTransit;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class VehicleSimulation
    {
        private readonly VehicleSimulationContext _context;
        private VehicleState _vehicleState;

        public VehicleSimulation(IBus bus, Guid vehicleId, IRoutePlanner routePlanner)
        {
            _context = new VehicleSimulationContext(routePlanner, vehicleId, bus);

            TakePause();
        }

        public void Update()
        {
            _vehicleState = _vehicleState.Update();
        }

        private void TakePause()
        {
            _vehicleState = new StandStillState(_context);
        }
    }
}
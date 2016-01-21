using System;
using MassTransit;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain
{
    public class VehicleSimulationContext
    {
        private readonly IRoutePlanner _routePlanner;
        private readonly IBus _bus;

        private volatile Route _route;

        public Random Random { get; }
        public Guid VehicleId { get; }

        public Route Route => _route;

        public Location Location { get; private set; }

        public VehicleSimulationContext(IRoutePlanner routePlanner, Guid vehicleId, IBus bus)
        {
            _routePlanner = routePlanner;
            _bus = bus;

            Random = new Random();
            VehicleId = vehicleId;
            _bus = bus;
            Location = routePlanner.RandomLocation();
        }

        public async void PlanNextRoute()
        {
            _route = null;
            _route = await _routePlanner.PlanNewRoute(Location);
        }

        public void PublishEvent<T>(T @event) where T : class
        {
            Console.WriteLine("Event published: " + @event);
            _bus.Publish(@event);
        }

        public void ArrivedAt(Location destination)
        {
            Location = destination;
        }

        public bool IsRoutePlanned()
        {
            return _route != null;
        }
    }
}
using System;
using System.Timers;
using MassTransit;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services;

namespace Soloco.RealTimeWeb.Environment
{
    internal class SimulateVehicleDataService : IDisposable
    {
        private readonly string[] _names = {
            "Yer",
            "Dwana",
            "Jonas",
            "Aliza",
            "Hallie",
            "Oneida",
            "Fletcher",
            "Moshe",
            "Maryrose",
            "Leona",
            "Torri",
            "Concetta",
            "Archie",
            "Dulcie",
            "Jarrett",
            "Princess",
            "Joanne",
            "Maricela",
            "Gwyneth",
            "Jennell"};

        private readonly IBusControl _bus;
        private readonly Timer _timer;
        private readonly VehicleSimulation[] _vehicleSimulations;
        private readonly IRoutePlanner _routePlanner;

        public SimulateVehicleDataService(IBusControl bus, IRoutePlanner routePlanner)
        {
            if (bus == null) throw new ArgumentNullException(nameof(bus));
            if (routePlanner == null) throw new ArgumentNullException(nameof(routePlanner));

            _bus = bus;
            _routePlanner = routePlanner;

            _vehicleSimulations = CreateSimulators(4);

            _timer = new Timer(1000) { AutoReset = true };
            _timer.Elapsed += UpdateSimulators;
        }

        private VehicleSimulation[] CreateSimulators(int numberOf)
        {
            var result = new VehicleSimulation[numberOf];
            for (var i = 0; i < numberOf; i++)
            {
                result[i] = new VehicleSimulation(_bus, Guid.NewGuid(), _names[i], _routePlanner);
            }
            return result;
        }

        public void Start()
        {
            Console.WriteLine("Service started");
            _timer.Start();
        }

        public void Stop()
        {
            Console.WriteLine("Service stopped");
            _timer.Stop();
        }

        public void Dispose()
        {
            Console.WriteLine("Service Disposed");
            _timer.Dispose();
        }

        private void UpdateSimulators(object sender, ElapsedEventArgs e)
        {
            foreach (var vehicleSimulation in _vehicleSimulations)
            {
                vehicleSimulation.Update();
            }
        }
    }
}
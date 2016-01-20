using System;
using System.Timers;
using MassTransit;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.Environment
{
    internal class SimulateVehicleDataService : IDisposable
    {
        private readonly IBusControl _bus;
        private readonly Timer _timer;

        public SimulateVehicleDataService(IBusControl bus)
        {
            if (bus == null) throw new ArgumentNullException(nameof(bus));

            _bus = bus;

            _timer = new Timer(1000) { AutoReset = true };
            _timer.Elapsed += PublishNextEvent;
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
            _timer.Dispose();
        }

        private async void PublishNextEvent(object sender, ElapsedEventArgs e)
        {
            Console.WriteLine("Publish event");

            var @event = new VehicleDriving { Id = Guid.NewGuid() };
            await _bus.Publish(@event);

            Console.WriteLine("Event published");
        }
    }
}
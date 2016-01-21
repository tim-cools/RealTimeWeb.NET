using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.Infrastructure.VehicleMonitor
{
    public class VehicleMonitoConsumer : IConsumer<VehicleDriving>, IConsumer<VehicleMoved>, IConsumer<VehicleStopped>
    {
        public Task Consume(ConsumeContext<VehicleDriving> context)
        {
            var clientEvent = new
            {
                id = context.Message.VehicleId,
                name = context.Message.VehicleName,
                origin = context.Message.Origin,
                destination = context.Message.Destination
            };

            var clients = GetHubClients();
            clients.All.vehicleDriving(clientEvent);

            return Task.FromResult(true);
        }

        public Task Consume(ConsumeContext<VehicleMoved> context)
        {
            var clientEvent = new
            {
                id = context.Message.VehicleId,
                name = context.Message.VehicleName,
                latitude = context.Message.Latitude,
                longitude = context.Message.Longitude
            };

            var clients = GetHubClients();
            clients.All.vehicleMoved(clientEvent);

            return Task.FromResult(true);
        }

        public Task Consume(ConsumeContext<VehicleStopped> context)
        {
            var clientEvent = new
            {
                id = context.Message.VehicleId,
                name = context.Message.VehicleName,
                location = context.Message.Location,
                latitude = context.Message.Latitude,
                longitude = context.Message.Longitude
            };

            var clients = GetHubClients();
            clients.All.vehicleStopped(clientEvent);

            return Task.FromResult(true);
        }

        private static IHubConnectionContext<dynamic> GetHubClients()
        {
            //todo use IoC for this, SignalR 3 is currently on hold (https://github.com/aspnet/Home/wiki/Roadmap#future-work)
            var _connectionManager = GlobalHost.ConnectionManager;
            return _connectionManager.GetHubContext<VehicleMonitorHub>().Clients;
        }
    }
}
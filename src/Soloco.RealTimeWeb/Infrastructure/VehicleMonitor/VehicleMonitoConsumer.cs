using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.Infrastructure.VehicleMonitor
{
    public class VehicleMonitoConsumer : IConsumer<VehicleDriving>
    {
        public Task Consume(ConsumeContext<VehicleDriving> context)
        {
            var clientEvent = new
            {
                id = context.Message.Id
            };

            var clients = GetHubClients();
            clients.All.vehicleDriving(clientEvent);

            return Task.FromResult(true);
        }

        private static IHubConnectionContext<dynamic> GetHubClients()
        {
            //todo use IoC for this, SignalR is currently on hold (https://github.com/aspnet/Home/wiki/Roadmap#future-work)
            var _connectionManager = GlobalHost.ConnectionManager;
            return _connectionManager.GetHubContext<VehicleMonitorHub>().Clients;
        }
    }
}
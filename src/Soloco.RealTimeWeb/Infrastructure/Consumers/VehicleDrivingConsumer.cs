using MassTransit;
using System.Threading.Tasks;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public class VehicleDrivingConsumer : IConsumer<VehicleDriving>
    {
        public Task Consume(ConsumeContext<VehicleDriving> context)
        {
            return Task.FromResult(true);
        }
    }
}
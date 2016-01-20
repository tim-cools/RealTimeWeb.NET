using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace Soloco.RealTimeWeb.Infrastructure.VehicleMonitor
{
    [HubName("vehicleMonitor")]
    public class VehicleMonitorHub : Hub
    {
    }
}
using System.Threading.Tasks;
using Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Domain;

namespace Soloco.RealTimeWeb.VehicleMonitor.Vehicles.Services
{
    public interface IRoutePlanner
    {
        Location RandomLocation();
        Task<Route> PlanNewRoute(Location location);
    }
}
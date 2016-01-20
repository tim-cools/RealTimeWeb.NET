using Soloco.RealTimeWeb.Common.StructureMap;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.VehicleMonitor
{
    public class VehicleMonitor : Registry
    {
        public VehicleMonitor()
        {
            Scan(options => { 
                options.TheCallingAssembly();
                options.Include(type => type.Name.EndsWith("Handler"));
                options.Convention<AllInterfacesConvention>();
            });
        }
    }
}
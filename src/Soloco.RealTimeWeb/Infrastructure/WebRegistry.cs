using Soloco.RealTimeWeb.Common.StructureMap;
using Soloco.RealTimeWeb.Controllers;
using Soloco.RealTimeWeb.Infrastructure.Documentation;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public class WebRegistry : Registry
    {
        public WebRegistry()
        {
            Scan(options =>
            {
                options.TheCallingAssembly();
                options.IncludeNamespaceContainingType<AccountController>();
                options.IncludeNamespaceContainingType<DocumentQueryHandler>();
                options.Convention<AllInterfacesConvention>();
            });
        }
    }
}
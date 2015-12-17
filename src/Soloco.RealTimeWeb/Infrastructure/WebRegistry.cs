using System;
using Soloco.RealTimeWeb.Controllers;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Infrastructure
{
    internal class WebRegistry : Registry
    {
        public WebRegistry()
        {
            Scan(options =>
            {
                options.TheCallingAssembly();
                options.IncludeNamespaceContainingType<AccountController>();
            });
        }
    }
}
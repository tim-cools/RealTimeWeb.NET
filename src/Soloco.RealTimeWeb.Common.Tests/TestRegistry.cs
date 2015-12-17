using Soloco.RealTimeWeb.Common.Container;
using Soloco.RealTimeWeb.Common.Tests.Storage;
using Soloco.RealTimeWeb.Common.Tests.Unit;
using StructureMap;
using StructureMap.Graph;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public class TestRegistry : Registry
    {
        public TestRegistry()
        {
            Scan(options =>
            {
                options.TheCallingAssembly();
                options.IncludeNamespaceContainingType<TestStoreDatabaseFactory>();
                options.Convention<AllInterfacesConvention>();
            });
        }
    }
}
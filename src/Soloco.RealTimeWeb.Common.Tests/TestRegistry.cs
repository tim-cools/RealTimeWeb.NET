using Soloco.RealTimeWeb.Common.StructureMap;
using Soloco.RealTimeWeb.Common.Tests.Storage;
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
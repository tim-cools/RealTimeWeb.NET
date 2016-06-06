using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Infrastructure;
using StructureMap;

namespace Soloco.RealTimeWeb.Tests
{
    public class WebIntegrationTestFixture : IntegrationTestFixture
    {
        protected override void InitializeContainer(ConfigurationExpression configuration)
        {
            configuration.AddRegistry<WebRegistry>();
        }
    }
}
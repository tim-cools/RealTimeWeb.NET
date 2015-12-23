using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Infrastructure;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    public class WebIntegrationTestFixture : IntegrationTestFixture
    {
        protected override void InitializeContainer(ConfigurationExpression configuration)
        {
            configuration.AddRegistry<WebRegistry>();
        }
    }
}
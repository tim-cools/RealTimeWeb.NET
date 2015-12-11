using System;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    public class MembershipIntegrationTestFixture : IntegrationTestFixture
    {
        protected override void InitializeContainer(ConfigurationExpression configuration)
        {
            configuration.AddRegistry<MembershipRegistry>();
        }
    }
}
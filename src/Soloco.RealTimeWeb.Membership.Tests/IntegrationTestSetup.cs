using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Common.Tests;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    public class MembershipIntegrationTestFixture : IntegrationTestFixture
    {
        protected override void InitializeContainer(Container configuration)
        {
            configuration.RegisterMembership();
        }
    }
}
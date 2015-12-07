using Soloco.RealTimeWeb.Common.Tests;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    public class MembershipIntegrationTestFixture : IntegrationTestFixture
    {
        public MembershipIntegrationTestFixture()
        {
            Container.RegisterMembership();
        }
    }
}
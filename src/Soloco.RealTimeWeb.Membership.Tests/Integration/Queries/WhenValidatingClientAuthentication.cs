using System;
using Shouldly;
using Xunit;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration.Queries
{
    public class WhenValidatingClientAuthentication : ServiceTestBase<IMessageDispatcher>, IClassFixture<MembershipIntegrationTestFixture>
    {
        private ValidateClientAuthenticationResult _result;
        private ValidateClientAuthenticationQuery _query;


        public WhenValidatingClientAuthentication(MembershipIntegrationTestFixture fixture) : base(fixture)
        {
        }

        protected override void When()
        {
            base.When();

            var clientId = Guid.NewGuid().ToString("n");
            var clientSecret = Guid.NewGuid().ToString("n");
            _query = new ValidateClientAuthenticationQuery(clientId, clientSecret);

            _result = Service.ExecuteNowWithTimeout(_query);
        }

        [Fact]
        public void ThenTheRefreshTokensShouldBeReturned()
        {
            _result.ShouldNotBeNull();
        }
    }
}